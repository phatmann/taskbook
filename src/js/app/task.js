/*global subclass Item YMD */

var DUE_DATE_DAYS_AHEAD = 30;

function Task(props) {
  if (typeof props === 'string') {
    props = {goal:props};
  }
  
  Task.baseConstructor.call(this, 'Task', props);
  
  this.goal             = props.goal;
  this.action           = props.action;
  this.completionDate   = null;
  
  if (props.createDate) {
    this.createDate = props.createDate;
  } else {
    this.createDate = YMD.now().toString();
  }
  
  if (props.startDate) {
    this.startDate = props.startDate;
  } else {
    this.startDate = this.createDate;
  }
  
  if (props.dueDate) {
    this.dueDate = props.dueDate;
  } else {
    this.dueDate = new YMD(this.startDate).addDays(DUE_DATE_DAYS_AHEAD).toString();
  }
  
  if (props.completionDate) {
    this.completionDate = props.completionDate;
  }
}

subclass(Task, Item);

$.extend(Task.prototype, { 
  toggleComplete: function() {
    if (this.completionDate === null) {
      this.setProperty('completionDate', new YMD.now());
    } else {
      this.setProperty('completionDate', null);
    }
  },
  
  // TODO: handle this in view template
  displayString: function() {
    if (this.action) {
      return this.action + '<p class="action_goal">' + this.goal + '</p>'; 
    } else {
      return this.goal;
    }
  }
});
