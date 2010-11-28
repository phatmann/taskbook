/*global Task */

function TasksController(book) {
  this.book       = book;
  this.dateGroups = null;
}

TasksController.prototype = {
  addTask: function(goal) {
    var goals = goal.split("\n");
    
    if (goals.length === 0) {
      goals = [goal];
    }
    
    for (var i = 0; i < goals.length; ++i) {
      this.book.add(new Task({goal:goals[i]}));
    }
    
    this.book.save();
  },
  
  setCurrentDate: function(date) {
    this.book.currentDate(date);
    this.book.save();
  },
  
  markTaskCompleted: function(task) {
    task.toggleComplete();
  },
  
  deleteTask: function(task) {
    this.book.remove(task);
    this.book.save();
  },
  
  loadFromDump: function(dump) {
    window.localStorage['collection_taskbook_default'] = dump;
    this.book.load();
  },
  
  activeDates: function() {
    // TODO: update incrementally
    
    //if (!this.dateGroups) {
      this.dateGroups = this.book.groups('startDate').concat(this.book.groups('dueDate')).unique().sort();
    //}
    
    return this.dateGroups;
  }
};