const hyphensAndCamelCaseToWords = (str: string) => {
  var arr = str.split(/[_-]/);
  var newStr = "";
  for (var i = 1; i < arr.length; i++) {
    newStr += arr[i].charAt(0).toUpperCase() + arr[i].slice(1) + " ";
  }

  const text = (arr[0] + newStr).trim();

  const result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

export default hyphensAndCamelCaseToWords;
