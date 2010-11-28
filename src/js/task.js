/*global subclass Collection YMD */

var DUE_DATE_DAYS_AHEAD = 30;

function Task(attrs) {
  if (typeof attrs === 'string') {
    attrs = {goal:attrs};
  }
  
  Task.baseConstructor.call(this, 'Task', attrs);
  
  this.goal             = attrs.goal;
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

subclass(Task, Collection.Item);

$.extend(Task.prototype, { 
  toggleComplete: function() {
    if (this.completionDate === null) {
      this.setProperty('completionDate', new YMD.now());
    } else {
      this.setProperty('completionDate', null);
    }
  }
});
