/*global Collection Task subclass */



function TaskBook(bookID, groupings) {
  Collection.baseConstructor.call(this, 'taskbook_' + bookID, groupings);
  this.currentDate  = null;
}

$.extend(TaskBook.prototype, {
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
      
      this.currentDate = tb['currentDate'];
    }
    
    // if (!this.currentDate && this.activeDates().length > 0) {
    //   this.currentDate = this.activeDates()[0];
    // }
  },
  
  save: function() {
    var tb = {tasks: this.tasks, nextTaskID: this.nextTaskID, currentDate: this.currentDate};
    
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
    task.book = this;
    task._id  = this.nextTaskID++;
    
    this.tasks.push(task);
    this.idGrouping.add(task);
    
    for (var grouping in this.groupings) {
      this.groupings[grouping].add(task);
    }
    
    $(this).trigger('change', {tasks: this.tasks}); // TODO: avoid this overhead on load
  },
  
  remove: function(task) {
    this.tasks.splice(this.tasks.indexOf(task), 1);
    this.idGrouping.remove(task);
    
    for (var grouping in this.groupings) {
      this.groupings[grouping].remove(task);
    }
    
    $(this).trigger('change', {tasks: this.tasks});
  },

  get: function(id) {
    return this.idGrouping.get(id);
  },
  
  allTasks: function() {
    return this.tasks;
  },
  
  group: function(property, value) {
    return this.groupings[property].get(value);
  },
  
  groups: function(property) {
    return this.groupings[property].groups();
  },
  
  beforeTaskChanged: function(task, property) {
    var grouping = this.groupings[property];
    
    if (grouping) {
      grouping.remove(task);
    }
  },
  
  taskChanged: function(task, property) {
    this.save();
    
    var grouping = this.groupings[property];
    
    if (grouping) {
      grouping.add(task);
    }
    
    $(this).trigger('taskChange', task);
  }
});
