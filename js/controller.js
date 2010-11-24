/*global Task */

function TasksController(book) {
  this.book = book;
}

TasksController.prototype = {
  addTask: function(goal) {
    var goals = goal.split("\n");
    
    if (goals.length === 0) {
      goals = [goal];
    }
    
    for (var i = 0; i < goals.length; ++i) {
      var t = new Task(this.book, goals[i]);
      this.book.add(t);
    }
    
    this.book.save();
  },
  
  setCurrentDate: function(date) {
    this.book.update({currentDate: date});
  },
  
  markTaskCompleted: function(task) {
    task.toggleComplete();
  },
  
  setTaskStartDate: function(task, date) {
    task.startDate = date;
    this.book.taskChanged(task);
  },
  
  setTaskDueDate: function(task, date) {
    task.dueDate = date;
    this.book.taskChanged(task);
  },
  
  deleteTask: function(task) {
    this.book.deleteTask(task);
  },
  
  loadFromDump: function(dump) {
    window.localStorage['taskbook_default'] = dump;
    this.book.load();
  }
};