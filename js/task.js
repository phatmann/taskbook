var DUE_DATE_DAYS_AHEAD = 30;
var MS_PER_DAY = 24 * 60 * 60 * 1000;

// TODO: deal with UTC issues

function Task(book, attrs) {
  this.book = book;
  
  if (typeof attrs == 'string') {
    attrs = {goal:attrs};
  }
  
  this.goal             = attrs.goal;
  this._id              = attrs._id || this.book.nextTaskID++;
  this.completionDate   = null;
  
  if (attrs.createDate) {
    this.createDate = new Date(attrs.createDate).clearTime();
  } else {
    this.createDate = new Date().clearTime();
  }
  
  if (attrs.startDate) {
    this.startDate = new Date(attrs.startDate).clearTime();
  } else {
    this.startDate = this.createDate;
  }
  
  if (attrs.dueDate) {
    this.dueDate = new Date(attrs.dueDate).clearTime();
  } else {
    this.dueDate = new Date().clearTime();
    var t = this.startDate.getTime() + DUE_DATE_DAYS_AHEAD * MS_PER_DAY;
    this.dueDate.setTime(t);
  }
  
  if (attrs.completionDate) {
    this.completionDate = new Date(attrs.completionDate).clearTime();
  }
}

Task.prototype = { 
  toggleComplete: function() {
    if (this.completionDate === null) {
      this.completionDate = new Date().clearTime();
    } else {
      this.completionDate = null;
    }
    
    this.book.taskChanged(this);
  }
};
