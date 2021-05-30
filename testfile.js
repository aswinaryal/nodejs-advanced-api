// const testfn = (...roles) => {
//   console.log('passed params', roles);
//   console.log(roles.includes('aswin'));
// };

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    console.log('k xa obj ma', obj);
    console.log('k xa el maa', el);
    console.log('allowed fields maa', allowedFields);
    console.log('obj el ma', obj[el]);
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  console.log('new obj', newObj);
  return newObj;
};

filterObj({ name: 'ashwin aryal', email: 'aswinaryal@gmail.com' }, 'name');

// testfn('aswin', 'raam');
