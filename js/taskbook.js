var tasksView;
var tasksController;
var taskBook;

var DUE_DATE_DAYS_AHEAD = 30;
var MS_PER_DAY = 24 * 60 * 60 * 1000;

// TODO: deal with UTC issues

Date.prototype.clearTime = function() 
{
  this.setHours(0); 
  this.setMinutes(0);
  this.setSeconds(0); 
  this.setMilliseconds(0);
  return this;
};

// http://www.martienus.com/code/javascript-remove-duplicates-from-array.html
Array.prototype.unique = function(transform) {
	var r = [];
	o:for(var i = 0, n = this.length; i < n; i++) {
		for(var x = 0, y = r.length; x < y; x++) {
			if(r[x]==this[i]) {
				continue o;
			}
		}
		r[r.length] = transform ? transform(this[i]) : this[i];
	}
	return r;
};

(function($){
	jQuery.fn.equals = function(selector) {
		return $(this).get(0)==$(selector).get(0);
	};
})(jQuery);

/***** Task *****/
function Task(attrs) {
  if (typeof attrs == 'string') {
    attrs = {goal:attrs};
  }
  
  this.goal             = attrs.goal;
  this._id              = attrs._id || taskBook.nextTaskID++;
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
}

Task.prototype = { 
  toggleComplete: function() {
    if (this.completionDate === null) {
      this.completionDate = new Date().clearTime();
    } else {
      this.completionDate = null;
    }
    
    taskBook.taskChanged(this);
  }
};

/*** TaskBook ***/

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

/***** TasksView *****/

function TasksView() {
  var self = this;
  
  $('[id]').each(function(){
    self[this.id] = $('#' + this.id);
  });
  
  $(taskBook).bind('change', function(e, props){
    self.onBookChange(props);
  });
  
  $(taskBook).bind('taskChange', function(e, task){
    self.onTaskChange(task);
  });
  
  self.prevDateButton.click(function() {
    self.selectPrevDate();
  });
  
  self.nextDateButton.click(function() {
    self.selectNextDate();
  });
  
  self.addButton.click(function() {
    tasksController.addTask(self.taskGoalField.val());
    self.taskGoalField.val('');
  });

  self.taskGoalField.keydown(function(e) {
    if (e.which == 13) {
      self.addButton.click();
    }
  });
  
  self.dateSelect.change(function() {
    tasksController.setCurrentDate(self.selectedDate());
  });
  
  self.loadButton.click(function() {
    window.localStorage['taskbook_default'] = self.taskDump.val();
    taskBook.load();
    self.render();
  });
  
  self.completedButton.click(function() {
    self.markTaskCompleted();
  });
  
  $('.task').live('click', function() {
    self.popupTask($(this));
  });
}

function taskFieldString(obj) {
  if (obj instanceof Date) {
    return $.datepicker.formatDate('yy M dd', obj);
  } else {
    return obj;
  }
}

TasksView.prototype = {
  render: function() {
    this.fillTaskList();
    this.fillDateSelect();
  },
  
  onBookChange: function(props) {
    if (props.currentDate) {
      this.fillActions();
      this.fillDueTasks();
    }
    
    if (props.tasks) {
      this.fillTaskList();
      
      // TODO: only update these when changed
      this.fillActions();
      this.fillDueTasks();
    }
  },
  
  onTaskChange: function(task) {
    var tasks = $('[value=' + task._id + ']');
    
    tasks.each(function() {
      $(this).toggleClass('completed', task.completionDate !== null);
    });
  },
  
  fillTaskList: function() {
    this.fillList(this.taskList, taskBook.allTasks());
  },
  
  fillDateSelect: function() {
    this.fillList(this.dateSelect, taskBook.activeDates);
    
    this.fillActions();
    this.fillDueTasks();
  },
  
  fillActions: function() {
    this.fillList(this.actionList, taskBook.currentTasks());
  },
  
  fillDueTasks: function() {
    this.fillList(this.dueTaskList, taskBook.dueTasks());
  },
  
  fillList: function(listElement, list) {
    var templateRow = listElement.data('template');
    
    if (!templateRow) {
      templateRow = listElement.find('.template');
      templateRow.detach();
      listElement.data('template', templateRow);
    }
    
    listElement.children().remove();
    
    for (var i = 0; i < list.length; ++i) {
      var item = list[i];
      var row = templateRow.clone();
      row.removeClass('template');
      
      if (item instanceof Date) {
        row.html(taskFieldString(item));
        row.attr('value', item.toString());
      } else {
        for (var field in item) {
          var elem = row.find('.' + field);
        
          if (elem.length > 0) {
            elem.html(taskFieldString(item[field]));
          }
        }
        
        if (item._id) {
          row.attr('value', item._id);
        }
        
        if (item.completionDate) {
          row.addClass('completed');
        }
      }
      
      listElement.append(row);
    }
 },
  
  selectedDate: function() {
    return new Date(this.dateSelect.find('option:selected').val());
  },
  
  selectPrevDate: function() {
    var opt = this.dateSelect.find('option:selected').prev();
    
    if (opt) {
      opt.attr('selected', true);
      this.dateSelect.change();
    }
  },
  
  selectNextDate: function() {
    var opt = this.dateSelect.find('option:selected').next();
    
    if (opt) {
      opt.attr('selected', true);
      this.dateSelect.change();
    }
  },
  
  popupTask: function(taskRow) {
    if (this.taskPopup.is(':visible')) {
      var oldTaskRow = this.taskPopup.data('taskRow');
      oldTaskRow.css('font-weight', 'normal');
      
      if (oldTaskRow.equals(taskRow)) {
        this.taskPopup.slideUp();
        return;
      }
    }
    
    var taskID = taskRow.attr('value');
    var task = taskBook.getTask(taskID);
    taskRow.css('font-weight', 'bold');
    this.taskPopup.data('taskRow', taskRow).slideDown();
  },
  
  markTaskCompleted: function() {
    var taskRow = this.taskPopup.data('taskRow');
    var taskID  = taskRow.attr('value');
    var task    = taskBook.getTask(taskID);
    
    task.toggleComplete();
  }
};

/***** TasksController *****/
function TasksController() {
}

TasksController.prototype = {
  addTask: function(goal) {
    var goals = goal.split("\n");
    
    if (goals.length === 0) {
      goals = [goal];
    }
    
    for (var i = 0; i < goals.length; ++i) {
      var t = new Task(goals[i]);
      taskBook.add(t);
    }
    
    taskBook.save();
  },
  
  setCurrentDate: function(date) {
    taskBook.update({currentDate: date});
  }
};

/**** main() *****/

$(function(){
  taskBook        = new TaskBook();
  taskBook.load();
  
  tasksView       = new TasksView();
  tasksController = new TasksController();
  
  tasksView.render();
});


