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
      var t = new Task(goals[i]);
      this.book.add(t);
    }
    
    this.book.save();
  },
  
  setCurrentDate: function(date) {
    this.book.update({currentDate: date});
  }
};