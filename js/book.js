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
          this.add(new Task(this, tasks[i]));
        } 

        if (tb['nextID']) {
          this.nextTaskID = tb['nextID'];
        } else {
          this.nextTaskID  = this.tasks[this.tasks.length - 1]._id + 1;
        }
      }
    }
    
    //this.loadActiveDates(); DONE on every add!
    
    if (this.activeDates.length > 0) {
      this.currentDate = this.activeDates[0];
    }
  },
  
  save: function() {
    var tb = {tasks: this.tasks, nextTaskID: this.nextTaskID};
    
    var ts = JSON.stringify(tb, function(key, value) {
      if (key == 'book') {
        return undefined;
      } else {
        return value;
      }
    });
    
    window.localStorage['taskbook_' + this.bookID] = ts;
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
    
    $(this).trigger('change', {tasks: this.tasks}); // TODO: avoid this overhead on load
  },
  
  deleteTask: function(task) {
    function removeFromIndex(task, index, date) {
      var key = date.toString();
      var indexEntry = index[key];
    
      if (indexEntry) {
        indexEntry.splice(indexEntry.indexOf(task), 1);
      }
    }
    
    this.tasks.splice(this.tasks.indexOf(task), 1);
    delete this.idIndex[task._id];
    removeFromIndex(task, this.startDateIndex, task.startDate);
    removeFromIndex(task, this.dueDateIndex,   task.dueDate);
    
    $(this).trigger('change', {tasks: this.tasks});
    this.save();
  },
  
  loadActiveDates: function() {
    for (var d in this.startDateIndex) {
      this.activeDates.push(d);
    }
    
    for (d in this.dueDateIndex) {
      this.activeDates.push(d);
    }
    
    this.activeDates = this.activeDates.unique();
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
