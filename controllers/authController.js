const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKING_EXPIRES_ID * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // cookie cannot be accessed or modified by the browser directly but via http requests only.
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // this makes sure for encrpyted connections only, like https

  res.cookie('jwt', token, cookieOptions);

  //removes the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });
    createSendToken(newUser, 201, res);
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('email and password required', 500));
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, res);
  } catch (e) {
    next(e);
  }
};

exports.protect = async (req, res, next) => {
  //1. getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in, Please log in to get access', 401)
    );
  }

  try {
    //2. verification token
    const decodedInfo = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );

    //3. check if user still exits

    const user = await User.findById(decodedInfo.id);
    if (!user) {
      return next(
        new AppError('The token belonging to this user does no longer exists.')
      );
    }

    //4. check if user changed password after the JWT was issued
    if (user.changedPasswordAfter(decodedInfo.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again', 401)
      );
    }

    //Grant access to protected route with user data appended to request
    req.user = user;
    next();
  } catch (e) {
    return next(e);
  }
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = async (req, res, next) => {
  try {
    //get user based on POSTed user email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(
        new AppError('There is no user with that email address', 404)
      );
    }
    // generate random reset token

    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    console.log('reset url =>>', resetURL);

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. \n If you didn't forget your password, please ignore this email!`;

    try {
      //send it to the user's email

      await sendEmail({
        email: req.body.email,
        subject: 'Your password reset token (Valid for 20 min)',
        message,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (e) {
      console.log('error ma', e);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          'There was an error sending the email. Try again later!',
          500
        )
      );
    }
  } catch (e) {
    next(e);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    //1. get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2. if token not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError('Token invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    //update changePasswordAt property for the user
    user.passwordChangedAt = Date.now() - 1000; //deducting around 1 seconds of time since jwt was issued, since sometimes jwt issued at time is before than this timestamp

    await user.save();

    // login the user with new JWT
    createSendToken(user, 200, res);
  } catch (e) {
    next(e);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword } = req.body;
    if (!currentPassword)
      return next(new AppError('No current password sent', 400));
    const user = await User.findById(req.user.id).select('+password');
    console.log('user ==>> ', user);

    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(new AppError('Your current password is wrong', 401));
    }

    //update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    createSendToken(user, 200, res);
  } catch (e) {
    next(e);
  }
};
