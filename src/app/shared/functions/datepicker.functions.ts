//function to covert ngb date //return today date if date is not given
export function toNgbDateStruct(date?: any) {
    if (date) {
      let dateArr = date.split('-');
      return { year: parseInt(dateArr[0]), month: parseInt(dateArr[1]), day: parseInt(dateArr[2]) };
    }
    else {
      let today = new Date();
      return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
    }
  }
  
  //function to convert from ngb date format to yyyy-mm-dd
  export function fromNgbDateStruct(date: any) {
    return date.year + '-' + ('0' + date.month).slice(-2) + '-' + ('0' + date.day).slice(-2);
  }