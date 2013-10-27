	/* ********************************************************************************************
		JQuery plugin
	*/

	jQuery.fn.extend({
	valiDate: function(options) {
		return this.each(function(){
				valiDate.instance().init(this,options);
			});
		}
	});

	/* ********************************************************************************************
		IE compatibility quirks
	*/
	if(!Function.prototype.bind)
	{
	  Function.prototype.bind = function(oThis){
	    if (typeof this !== "function") {
	      // closest thing possible to the ECMAScript 5 internal IsCallable function
	      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	    }

	    var aArgs = Array.prototype.slice.call(arguments, 1), 
	        fToBind = this, 
	        fNOP = function () {},
	        fBound = function () {
	          return fToBind.apply(this instanceof fNOP && oThis
	                                 ? this
	                                 : oThis,
	                               aArgs.concat(Array.prototype.slice.call(arguments)));
	        };

	    fNOP.prototype = this.prototype;
	    fBound.prototype = new fNOP();

	    return fBound;
	  };
	}
	if(!Array.prototype.indexOf)
	{
		Array.prototype.indexOf = function(needle){
			for(var i = 0; i<this.length; i++)
				if(this[i]==needle)
					return i;
			return -1;
		}
	}



	/* ********************************************************************************************
		valiDate code
	*/

	var valiDate = {
		instances : [],
		_id : 0,
		instance : function(){
			var valiDate_instance = function() {};
			valiDate_instance.prototype = this;
			var i = new valiDate_instance();
			i.id = this._id;
			this.instances[this._id++] = i;

			if(this._id==1)
			{
				this.selector = $('#valiDateSelector');
				this.dateList = $('#valiDateList')[0];
				this.currentYear = (new Date()).getFullYear();
			}

			return i;
		},

		init : function(element,options){
			this.options = options;
			this.element = element;
			this.validInput = false;
			element.valiDate = this;

			if(element.className.indexOf('valiDate')<0)
				element.className += ' valiDate';

			this.$ = $(element);
			this.offset = element.getBoundingClientRect();

			// event handling
			this.$
			//#keyup
			.keyup(function(){
				if(this.timer)
					window.clearTimeout(this.timer);
				this.timer = window.setTimeout(valiDate.checkDate.bind(this),400);
			}.bind(this))
			//#focus
			.focus(function(){
				this.checkDate();
				window.clearTimeout(valiDate.hideTimer)
			}.bind(this))
			//#blur
			.blur(function(){
				valiDate.hideTimer = window.setTimeout(function(){$(valiDate.selector).hide()},100)
			});
		},

		regexp : /([0-9]{1,4})[^0-9]+([0-9]{1,4})[^0-9]+([0-9]{1,4})/,
		months : ['jan','feb','mar','apr','may','jun','jul','aug','sep','okt','nov','dec'],
		checkDate : function(){
			var result = valiDate.regexp.exec(this.element.value);

			if(result === null)
			{
				this.options.onInvalid && this.options.onInvalid.call(this.element,this) || this.unknownDate();
				return false;
			}

			var dateParts = Array.prototype.slice.call(result,1,4);
			var year = [], month = [], day = [];
			var hasYear = false;
			for(i=0;i<3;i++)
			{
				var originalLength = dateParts[i].length;
				//add leading 0
				if(originalLength==1)
					dateParts[i] = '0'+ dateParts[i];

				if(dateParts[i]!='00' && originalLength!=3)
				{
					//could be year?
					if(dateParts[i].length==4)
					{
						if(hasYear)
						{
							this.options.onInvalid && this.options.onInvalid.call(this.element,this) || this.unknownDate();
							return false;						
						}
						hasYear = true;
						year = [i];
					}
					else if(!hasYear && originalLength==2)
						year.push(i);

					// could be month?
					if(dateParts[i]<13)
						month.push(i);

					// could be a day?
					if(dateParts[i].length<3 && dateParts[i]<32)
						day.push(i);
				}
			}
			var dates = [];
			for(var y=0;y<year.length;y++)
			{
				for(var m=0;m<month.length;m++)
				{
					for(var d=0;d<day.length;d++)
					{
						if(year[y]+month[m]+day[d] == 3 && year[y]*month[m]*day[d]==0)
						{
							var date = ""+dateParts[year[y]]+". "+valiDate.months[dateParts[month[m]]-1]+" "+dateParts[day[d]] + '.';
							if(dateParts[year[y]].length==4)
							{
								if(dates.indexOf(date)<0)
									dates.push(date);
							}
							else
							{
								if(dates.indexOf("19"+date)<0)
									dates.push("19"+date);
								if((valiDate.currentYear >= 2000+parseInt(dateParts[year[y]])) && (dates.indexOf("20"+date)<0))
									dates.push("20"+date);
							}
						}
					}
				}
			}
			if(!dates.length)
			{
				this.options.onInvalid && this.options.onInvalid.call(this.element,this) || this.unknownDate();
				return false;										
			}

			dateHTML = "<li>"+dates.join("</li><li>")+"</li>";
			this.showOptions(dateHTML);
		},

		showOptions : function(dateHTML){
			if(this.dateHTML!=dateHTML)
			{
				this.dateHTML = dateHTML;
				this.options.onEdit && this.options.onEdit.call(this.element,this);
			}

			if(valiDate.dateList.innerHTML!=dateHTML)
			{
				valiDate.dateList.innerHTML=dateHTML;

				var $this = this;
				$(valiDate.dateList).children().click(function(){
					$this.validInput = this.innerHTML;
					$this.onSelect();
				});
			}

			this.showSelector();
		},

		onSelect : function(){
			this.validInput && this.options.onSelect && this.options.onSelect.call(this.element,this);

			$(valiDate.selector).hide();
		},

		unknownDate : function(){
			valiDate.dateList.innerHTML="<i>unknown format</i>";

			this.showSelector();
		},

		showSelector : function(){
			$(valiDate.selector).css({
				top      : this.offset.bottom,
				left     : this.offset.left,
				minWidth : this.offset.width ? this.offset.width : (this.offset.right - this.offset.left)
			}).show();

			var $this = this;
			$(valiDate.dateList).children().each(function(){
				if(this.innerHTML == $this.validInput)
					this.className = 'selected';
			});
		}

	};


	/* ********************************************************************************************
		onload init
	*/

	$(function(){
		document.body.insertAdjacentHTML('beforeend','<div id="valiDateSelector"><ul id="valiDateList"></ul></div>');
	});

