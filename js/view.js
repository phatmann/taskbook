/*global subclass */

function View(controller) {
  this.controller = controller;
  var self = this;
  
  /* Cache view elements */
  $('[id]').each(function(){
    self[this.id] = $('#' + this.id);
  });
  
  /* Route click handlers to buttons */
  // TODO: put in router method, for subclasses to override
  $('button').click(function(){
    var handler = self[this.id + 'Click'];
    
    if (typeof handler == 'function') {
      return handler.call(self);
    } else {
      console.log('Click on button ' + this.id + ' not handled');
    }
    
    return true;
  });
}

View.prototype = {
  displayString: function(obj) {
    if (obj instanceof Date) {
      return $.datepicker.formatDate('yy M dd', obj);
    } else {
      return obj;
    }
  },
  
  fillRow: function(row, item) {
    for (var field in item) {
      var elem = row.find('.' + field);
    
      if (elem.length > 0) {
        elem.html(this.displayString(item[field]));
      }
    }
    
    // TODO: code below should be in subclass
    
    if (item._id) {
      row.attr('value', item._id);
    }
    
    row.toggleClass('completed', item.completionDate !== null);
  },
  
  fillList: function(listElement, list) {
    var templateRow = listElement.data('template');
    
    if (!templateRow) {
      templateRow = listElement.find('.template');
      templateRow.detach();
      listElement.data('template', templateRow);
    }
    
    listElement.html('');
    
    for (var i = 0; i < list.length; ++i) {
      var item = list[i];
      var row = templateRow.clone();
      row.removeClass('template');
      
      if (item instanceof Date) {
        row.html(this.displayString(item));
        row.attr('value', item.toString());
      } else {
        this.fillRow(row, item);
      }
      
      listElement.append(row);
    }
  }
};

function TasksView(controller) {
  TasksView.baseConstructor.call(this, controller);
  this.router();
  
  /* Set up date fields */
  $('.dateField').datepicker({
    xaltField: '#tickler_date',
    xaltFormat: 'yy-mm-dd',
    xautoSize: true,
    dateFormat: 'yy M dd',
    onSelect: function() {
      $(this).trigger('dateChange');
    }
  });
}

subclass(TasksView, View);

$.extend(TasksView.prototype, {
  router: function() {
    var self = this;
  
    self.dateSelect.change(function() {
      self.controller.setCurrentDate(self.selectedDate());
    });
  
    self.taskGoalField.keydown(function(e) {
      if (e.which == 13) {
        self.addButtonClick();
      }
    });
  
    $('.task').live('click', function() {
      self.taskClick($(this));
    });
  
    self.taskDump.click(function() {
      this.select();
      return false;
    });
    
    self.startDateField.bind('dateChange', function() {
      self.startDateFieldDateChange();
    });
    
    self.dueDateField.bind('dateChange', function() {
      self.dueDateFieldDateChange();
    });
  
    $(self.controller.book).bind('change', function(e, props){
      self.bookChange(props);
    });
  
    $(self.controller.book).bind('taskChange', function(e, task){
      self.taskChange(task);
    });
  },
  
  render: function() {
    this.fillTaskList();
    this.fillDateSelect();
  },
  
  bookChange: function(props) {
    if (props.currentDate) {
      this.fillActions();
      this.fillDueTasks();
    }
    
    if (props.tasks) {
      this.fillTaskList();
      
      // TODO: only update these when changed
      this.fillDateSelect();
    }
  },
  
  taskChange: function(task) {
    var taskRows = $('[value=' + task._id + ']');
    var self = this;
    
    taskRows.each(function() {
      self.fillRow($(this), task);
    });
  },
  
  addButtonClick: function() {
    this.controller.addTask(this.taskGoalField.val());
    this.taskGoalField.val('');
  },
  
  loadButtonClick: function() {
    this.controller.loadFromDump(this.taskDump.val());
    this.render();
  },
  
  prevDateButtonClick: function() {
    var opt = this.dateSelect.find('option:selected').prev();
    
    if (opt) {
      opt.attr('selected', true);
      this.dateSelect.change();
    }
  },
  
  nextDateButtonClick: function() {
    var opt = this.dateSelect.find('option:selected').next();
    
    if (opt) {
      opt.attr('selected', true);
      this.dateSelect.change();
    }
  },
  
  completedButtonClick: function() {
    var task = this.taskPopup.data('task');
    this.toggleTaskPopup();
    this.controller.markTaskCompleted(task);
  },
  
  taskClick: function(task) {
    this.toggleTaskPopup(task);
  },
  
  startDateFieldDateChange: function() {
    var task = this.taskPopup.data('task');
    this.toggleTaskPopup();
    this.controller.setTaskStartDate(task, this.startDateField.datepicker('getDate'));
  },
  
  dueDateFieldDateChange: function() {
    var task = this.taskPopup.data('task');
    this.toggleTaskPopup();
    this.controller.setTaskDueDate(task, this.dueDateField.datepicker('getDate'));
  },
  
  fillTaskList: function() {
    this.fillList(this.taskList, this.controller.book.allTasks());
    $('#taskDump').val(window.localStorage['taskbook_default']);
  },
  
  fillDateSelect: function() {
    this.fillList(this.dateSelect, this.controller.book.activeDates);
    
    this.fillActions();
    this.fillDueTasks();
  },
  
  fillActions: function() {
    this.fillList(this.actionList, this.controller.book.currentTasks());
  },
  
  fillDueTasks: function() {
    this.fillList(this.dueTaskList, this.controller.book.dueTasks());
  },
  
  selectedDate: function() {
    return new Date(this.dateSelect.find('option:selected').val());
  },
  
  toggleTaskPopup: function(taskRow) {
    if (this.taskPopup.is(':visible')) {
      var oldTaskRow = this.taskPopup.data('taskRow');
      oldTaskRow.removeClass('selected');
      
      if (!taskRow || oldTaskRow.equals(taskRow)) {
        this.taskPopup.slideUp("fast");
        return;
      }
    }
    
    var taskID = taskRow.attr('value');
    var task   = this.controller.book.getTask(taskID);
    
    taskRow.addClass('selected');
    
    if (task.completionDate) {
      this.completedButton.text('Incomplete');
    } else {
      this.completedButton.text('Complete');
    }
    
    this.startDateField.datepicker('setDate', task.startDate);
    this.dueDateField.datepicker('setDate', task.dueDate);
    
    this.taskPopup
      .data('taskRow', taskRow)
      .data('task', task)
      .css( {
        left: taskRow.offset().left + "px", 
        top: taskRow.offset().top + taskRow.outerHeight() + 1 + "px"
      })
      .slideDown("fast");
  }
});