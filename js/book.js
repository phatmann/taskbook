/*global Task */

function TaskBook() {
  this.tasks          = [];
  this.nextTaskID     = 1;
  this.bookID         = "default";
  this.idIndex        = {};
  this.startDateIndex = {};
  this.dueDateIndex   = {};
  this.activeDates    = [];
  this.currentDate    = null;
}

TaskBook.prototype = {
  load: function() {
    this.tasks = [];
    
    var tb = window.localStorage['taskbook_' + this.bookID];
  
    if (tb) {
      tb = JSON.parse(tb);
      var tasks = tb['tasks'];

      if (tasks && tasks.length > 0) {
        for (var i = 0; i < tasks.length; ++i) {
          this.add(new Task(tasks[i]));
        } 

        if (tb['nextID']) {
          this.nextTaskID = tb['nextID'];
        } else {
          this.nextTaskID  = this.tasks[this.tasks.length - 1]._id + 1;
        }
      }
    }
    
    this.loadActiveDates();
    
    if (this.activeDates.length > 0) {
      this.currentDate = this.activeDates[0];
    }
  },
  
  save: function() {
    var tb = {tasks: this.tasks, nextTaskID: this.nextTaskID};
    var ts = JSON.stringify(tb);
    window.localStorage['taskbook_' + this.bookID] = ts;
    $('#taskDump').val(ts);
  },
  
  update: function(props) {
    $.extend(this, props);
    $(this).trigger('change', props);
  },
  
  add: function(task) {
    function addToIndex(task, index, date) {
      var key = date.toString();
      var indexEntry = index[key];
    
      if (!indexEntry) {
        indexEntry = index[key] = [];
      }
    
      indexEntry.push(task);
    }
    
    this.tasks.push(task);
    this.idIndex[task._id] = task;
    
    addToIndex(task, this.startDateIndex, task.startDate);
    addToIndex(task, this.dueDateIndex,   task.dueDate);
    this.loadActiveDates(); // TODO: update incrementally
    
    $(this).trigger('change', {tasks: this.tasks});
    
    // TODO: did not cause view to reload active dates
  },
  
  loadActiveDates: function() {
    var dates = [];
    
    for (var d in this.startDateIndex) {
      dates.push(d);
    }
    
    for (d in this.dueDateIndex) {
      dates.push(d);
    }
    
    this.activeDates = dates.unique(function(d) {
      return new Date(d);
    });
  },
  
  getTask: function(id) {
    return this.idIndex[id];
  },
  
  allTasks: function() {
    return this.tasks;
  },
  
  currentTasks: function() {
    if (!this.currentDate) {
      return [];
    }
    
    return this.startDateIndex[this.currentDate.toString()] || [];
  },
  
  dueTasks: function() {
    if (!this.currentDate) {
      return [];
    }
    
    return this.dueDateIndex[this.currentDate.toString()] || [];
  },
  
  taskChanged: function(task) {
    this.save();
    $(this).trigger('taskChange', task);
  }
};
