module.exports = () => {
  var time = new Date();

  return '[' + time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + '] ';
}
