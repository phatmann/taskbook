/*global YMD */

var DUE_DATE_DAYS_AHEAD = 30;

function Task(book, attrs) {
  this.book = book;
  
  if (typeof attrs == 'string') {
    attrs = {goal:attrs};
  }
  
  this.goal             = attrs.goal;
  this._id              = attrs._id || this.book.nextTaskID++;
  this.completionDate   = null;
  
  if (attrs.createDate) {
    this.createDate = attrs.createDate;
  } else {
    this.createDate = YMD.now().toString();
  }
  
  if (attrs.startDate) {
    this.startDate = attrs.startDate;
  } else {
    this.startDate = this.createDate;
  }
  
  if (attrs.dueDate) {
    this.dueDate = attrs.dueDate;
  } else {
    this.dueDate = new YMD(this.startDate).addDays(DUE_DATE_DAYS_AHEAD).toString();
  }
  
  if (attrs.completionDate) {
    this.completionDate = attrs.completionDate;
  }
}

Task.prototype = { 
  toggleComplete: function() {
    if (this.completionDate === null) {
      this.completionDate = new YMD.now();
    } else {
      this.completionDate = null;
    }
    
    this.book.taskChanged(this);
  }
};
