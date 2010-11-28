

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