/*global YMD */

var DUE_DATE_DAYS_AHEAD = 30;

// TODO: move common functionality to ModelItem class

function Task(attrs) {
  this.book = null;
  this.itemType = 'Task';
  
  if (typeof attrs == 'string') {
    attrs = {goal:attrs};
  }
  
  this.goal             = attrs.goal;
  this.itemID           = attrs.itemID;
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
  setProperty: function(property, value) {
    this.book.beforeTaskChanged(this, property);
    this[property] = value;
    this.book.taskChanged(this, property);
  },
  
  toggleComplete: function() {
    if (this.completionDate === null) {
      this.setProperty('completionDate', new YMD.now());
    } else {
      this.setProperty('completionDate', null);
    }
  }
};
