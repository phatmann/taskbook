

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

$(function() {
  // Input prompts
	// http://kyleschaeffer.com/best-practices/input-prompt-text/
	$('input[title]').each(function(i){
    $(this).addClass('input-prompt-' + i);
    
    var promptSpan = $('<span class="input-prompt"/>');
    $(promptSpan).attr('id', 'input-prompt-' + i);
    $(promptSpan).append($(this).attr('title'));
    
    $(promptSpan).click(function(){
      $(this).hide();
      $('.' + $(this).attr('id')).focus();
    });
    
    if($(this).val() !== ''){
      $(promptSpan).hide();
    }
    
    $(this).before(promptSpan);
    
    $(this).focus(function(){
      $('#input-prompt-' + i).hide();
    });
    
    $(this).blur(function() {
      $('#input-prompt-' + i).css('display', $(this).val() === '' ? 'inline' : 'none');
    });
  });
});

// http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm
function subclass(subClass, baseClass) {
   function Inheritance() {}
   Inheritance.prototype = baseClass.prototype;
   subClass.prototype = new Inheritance();
   subClass.prototype.constructor = subClass;
   subClass.baseConstructor = baseClass;
   subClass.superClass = baseClass.prototype;
}


function YMD(dateOrYear, month, day) {
  if (dateOrYear.getFullYear) {
    this.year  = dateOrYear.getFullYear();
    this.month = dateOrYear.getMonth() + 1;
    this.day   = dateOrYear.getDay();
  } else if (typeof dateOrYear == 'string') {
    var a = dateOrYear.split('-');
    this.year  = parseInt(a[0], 10);
    this.month = parseInt(a[1], 10);
    this.day   = parseInt(a[2], 10);
  } else {
    this.year  = dateOrYear;
    this.month = month;
    this.day   = day;
  }
}

YMD.MS_PER_DAY = 24 * 60 * 60 * 1000;

YMD.now = function() {
  return new YMD(new Date());
};

// TODO: use a singleton Date object
// TODO: YMD usage is still awkward. Need to improve this.

YMD.prototype = {
  toString: function(format) {
    if (format) {
      return $.datepicker.formatDate(format, this.toDate());
    }
    
    return this.year + '-' + this.month + '-' + this.day;
  },
  
  toDate: function() {
    return new Date(this.year, this.month - 1, this.day, 0, 0, 0, 0);
  },
  
  addDays: function(days) {
    var d = this.toDate();
    d.setTime(d.getTime() + days * YMD.MS_PER_DAY);
    return new YMD(d);
  }
};

/*** Event ***/
// Based on code posted at http://www.alexatnet.com/content/model-view-controller-mvc-javascript

var Event = function(sender) {
  this.sender    = sender;
  this.listeners = [];
};

Event.map = function(sender, events) {
  if (!sender.event) {
    sender.event = {};
  }
  
  for (var i = 0; i < events.length; ++i) {
    sender.event[events[i]] = new Event(sender);
  }
};
 
Event.prototype = {
  attach: function(listener) {
    this.listeners.push(listener);
  },
  
  notify: function(args) {
    for (var i = 0; i < this.listeners.length; i++) {
      this.listeners[i](this.sender, args);
    }
  }
};

