module.exports = () => {
  let time = new Date();
  let hh = String(time.getHours()).padStart(2, '0');
  let mm = String(time.getMinutes()).padStart(2, '0');
  let ss = String(time.getSeconds()).padStart(2, '0');

  return hh + ':' + mm + ':' + ss;
}
