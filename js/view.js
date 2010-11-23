/*global subclass */

function View(controller) {
  this.controller = controller;
  var self = this;
  
  /* Cache view elements */
  $('[id]').each(function(){
    self[this.id] = $('#' + this.id);
  });
}

function TasksView(controller) {
  TasksView.baseConstructor.call(this, controller);
  self = this;
  
  $(this.controller.book).bind('change', function(e, props){
    self.onBookChange(props);
  });
  
  $(this.controller.book).bind('taskChange', function(e, task){
    self.onTaskChange(task);
  });
  
  self.prevDateButton.click(function() {
    self.selectPrevDate();
  });
  
  self.nextDateButton.click(function() {
    self.selectNextDate();
  });
  
  self.addButton.click(function() {
    controller.addTask(self.taskGoalField.val());
    self.taskGoalField.val('');
  });

  self.taskGoalField.keydown(function(e) {
    if (e.which == 13) {
      self.addButton.click();
    }
  });
  
  self.dateSelect.change(function() {
    controller.setCurrentDate(self.selectedDate());
  });
  
  self.loadButton.click(function() {
    window.localStorage['taskbook_default'] = self.taskDump.val();
    this.controller.book.load();
    self.render();
  });
  
  self.completedButton.click(function() {
    self.markTaskCompleted();
  });
  
  $('.task').live('click', function() {
    self.popupTask($(this));
  });
  
  $('#taskDump').click(function() {
    this.select();
    return false;
  });
}

function taskFieldString(obj) {
  if (obj instanceof Date) {
    return $.datepicker.formatDate('yy M dd', obj);
  } else {
    return obj;
  }
}

subclass(TasksView, View);

$.extend(TasksView.prototype, {
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
      this.fillDateSelect();
    }
  },
  
  onTaskChange: function(task) {
    var tasks = $('[value=' + task._id + ']');
    
    tasks.each(function() {
      $(this).toggleClass('completed', task.completionDate !== null);
    });
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
      //oldTaskRow.css('text-decoration', 'none');
      
      if (!taskRow || oldTaskRow.equals(taskRow)) {
        this.taskPopup.slideUp("fast");
        return;
      }
    }
    
    var taskID = taskRow.attr('value');
    var task = this.controller.book.getTask(taskID);
    //taskRow.css('text-decoration', 'underline');
    
    if (task.completionDate) {
      this.completedButton.text('Incomplete');
    } else {
      this.completedButton.text('Complete');
    }
    
    this.taskPopup
      .data('taskRow', taskRow)
      .css( {
        left: taskRow.find('.goal').offset().left + "px", 
        top: taskRow.offset().top + taskRow.outerHeight() + 1 + "px"
      })
      .slideDown("fast");
  },
  
  markTaskCompleted: function() {
    var taskRow = this.taskPopup.data('taskRow');
    var taskID  = taskRow.attr('value');
    var task    = this.controller.book.getTask(taskID);
    
    task.toggleComplete();
    this.popupTask();
  }
});