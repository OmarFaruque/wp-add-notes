/**
 * responsivestickynotes-obj.js
 * The singleton class that initializes and handle all notes, and menu callback functions
 */

function responsivestickynotes_object() {
	this.notes = [];
	this.highestZ = 999;
	this.started = false;
	this.moving = false;
	this.adding = false;
	this.cssString = "";
	this.baseElement = null;
	this.noteMoving = null;
	this.curMouseX = 0;
	this.curMouseY = 0;
}

responsivestickynotes_object.prototype = {

	init: function() {
		// omar code
		jQuery(document).ready(function(){
			setTimeout(function(){
				var params = (new URL(document.location)).searchParams;
				var v_name = params.get("v");
				var current_time = params.get("t");

				if(v_name && current_time){
					var v_duration = jQuery(`[src*="${v_name}"]`).get(0).duration;
					jQuery(`[src*="${v_name}"]`).attr('src', `${jQuery(`[src*="${v_name}"]`).attr('src')}#t=${current_time},${v_duration}` );
				}
			},500);
		});


		// Add video push event for add note
		jQuery("video").on("pause", function (e) { 
			responsivestickynotes_add_note(e, jQuery(this));
		});


		jQuery("*").each(function() {
			if (!responsivestickynotes_obj.isAdminBar(jQuery(this))) {
			    var current = parseInt(jQuery(this).css("z-index"), 10);
			    if(current && responsivestickynotes_obj.highestZ < current) {
			    	responsivestickynotes_obj.highestZ = current+1;
			    }
			}
		});

		jQuery(window).on("mousemove", function(e) {
			responsivestickynotes_obj.positionCursor(e);
		});
		jQuery(window).on("mouseup", function(e) {
			responsivestickynotes_obj.stopMove();
		});

		responsivestickynotes_obj.highestZ++;

		jQuery(document.getElementsByClassName('addnote-responsivestickynote')).insertAfter('head');
		jQuery('body').append('<div class="responsivestickynotes-add-marker"></div>');
		jQuery('body').append('<div class="responsivestickynotes-move-marker"></div>');

		//get all notes
		pageIds = [];

		re = /page-id-(\d+)/;
		var bodyClass = jQuery("body").attr("class");
		var match = re.exec(bodyClass);
		if (match != null && match.length > 1) {

			if (bodyClass.indexOf(match[0]) > -1) {
				pageIds.push(match[1]);
			}
		}
		//in case the body class not present (body_class() not used), add in the actual page ID anyway
		if (pageIds.indexOf(responsivestickynotes_vars.pageId) == -1) {
			pageIds.push(responsivestickynotes_vars.pageId);
		}

		jQuery("article").each(function(index, element) {
			var attr = jQuery(this).attr("id");
			if (attr != undefined) {
				var re = new RegExp('post-([0-9]+)');
				var match = re.exec(attr);
				if (match != null && match.length> 1) {
					pageIds.push(match[1]);
				}
			}
		});
		var note_obj = this;

		var data = {
			'action': 'responsivestickynotes_fetchall',
			'security': responsivestickynotes_vars.postNoteNonce,
			'ids': pageIds
			};

		jQuery.ajax({
			url: ajaxurl,
			data:data,
			dataType:'json',
			error: function() {
				console.log('error1');
			},
			success: function(data) {
				jQuery.each (data, function(noteIndex, noteData) {
					var elementChain = noteData.elementChain;
					var ec = note_obj.getBrowserCorrectChain(elementChain);
					if (ec != null) {
						noteData.elementChain = ec;
						note_obj.createNote(noteData);
					}
				});
			},
			method: 'POST'
		});

		jQuery(window).on("resize", function() {
			positionNotes();
		});

		repositionNotes();

		
		autoScroll(this);

        function autoScroll(obj) {
			
            setTimeout(function() {
            	autoScroll(obj);
            },10);
        	if (!obj.moving && !obj.adding) return;
    		var absTop = 0;
    	    if (jQuery('#wpadminbar').length > 0) {
    	    	absTop = jQuery('#wpadminbar').height();
    	    }

    		var xScroll = 0;
    		var yScroll = 0;
    		var margin = 30;
    		var scrollTop = jQuery(window).scrollTop();
    		var top = obj.curMouseY;
    		var h = jQuery(window).height();
    		if (top - scrollTop < absTop + margin) {
    			yScroll = -10;
    		}
    		if (top - scrollTop > jQuery(window).height() - margin) {
    			yScroll = 10;
    		}

    		if (obj.curMouseY + margin * 2 < jQuery(document).height()) jQuery(window).scrollTop(scrollTop + yScroll);
    		var w = jQuery(window).width();
    		var scrollLeft = jQuery(window).scrollLeft();
    		var left = obj.curMouseX;
    		if (left - scrollLeft < margin) {
    			xScroll = -10;
    		}
    		if (left - scrollLeft > w - margin) {
    			xScroll = 10;
    		}
    		if (obj.curMouseX + margin * 2 < jQuery(document).width()) jQuery(window).scrollLeft(scrollLeft + xScroll);

        }
		function positionNotes() {
			responsivestickynotes_obj.notes.forEach (function(note) {
				note.setBasePosition();
			});
			//deal with coincident positions, which may happen if elements are removed
			for (var i=0;i<responsivestickynotes_obj.notes.length;i++) {
				var note = responsivestickynotes_obj.notes[i];
				var z = responsivestickynotes_obj.highestZ;
				jQuery("#" + note.id).css("z-index",z);
				var containerZ = z + responsivestickynotes_obj.notes.length;
				z++;
				for (var p=i+1;p<responsivestickynotes_obj.notes.length;p++) {
					var note1 = responsivestickynotes_obj.notes[p];
					var offset = 15;
					if (Math.abs(note.top - note1.top) < offset && Math.abs(note.left - note1.left) < offset) {
						note1.top = note.top + offset;
						note1.left = note.left + offset;
					}
				}
				note.move();
			}
		}
		function repositionNotes() { //in case an element is animated
			positionNotes();
	         setTimeout(function() {
	            repositionNotes();
	        },100);
		}
	},
	isAdminBar: function(obj) {
	    return (obj.attr("id") == "wpadminbar" || jQuery("div#wpadminbar").find(obj).length>0);
	},
	startMove: function(note, event) {
		jQuery("body").css({"-webkit-touch-callout": "none", "-webkit-user-select": "none", "-khtml-user-select": "none", "-moz-user-select": "none", "-ms-user-select": "none", "user-select": "none"})
		this.moving = true;
		this.noteMoving = note;
		this.mouseX = event.pageX;
		this.mouseY = event.pageY;
		this.positionCursor(event);
		this.killHrefs();
		jQuery("body,a").css("cursor","none");
	},
	stopMove: function () {
		if (this.moving && this.noteMoving != null) {
			this.moving = false;
			this.noteMoving.stopMove();
			jQuery("body").css({"-webkit-touch-callout": "auto", "-webkit-user-select": "auto", "-khtml-user-select": "auto", "-moz-user-select": "auto", "-ms-user-select": "auto", "user-select": "auto"})
			this.restoreHrefs();
			jQuery("body").css("cursor","auto");
			jQuery("a").css("cursor","pointer");
			jQuery(".responsivestickynotes-move-marker").css({"display":"none"});
		}
	},
	stripTrailingHash: function(s) {
		//strip trailing # which will be added to all hrefs by killHrefs(), and may be included in the saved data
		if (s.indexOf("#", s.length-1) != -1) {
			s = s.substr(0, s.length-1);
		}
		return s;
	},

	positionCursor: function(event) {

	    if (this.isAdminBar(jQuery(event.target))) {
	    	return;
	    }
	    this.curMouseX = event.pageX;
	    this.curMouseY = event.pageY;
		var markerClass="responsivestickynotes-highlight-block";

		if (this.baseElement != null) {
			this.baseElement.removeClass(markerClass);
	     }
	    var change = (this.baseElement != jQuery(event.target));
	    this.baseElement = jQuery(event.target);


	    var found = false;
	    var obj = this;
    	responsivestickynotes_obj.notes.forEach (function(note) {
			//ignore if over an active note
			if (obj.baseElement != null && obj.baseElement.attr('id') == note.noteAreaId) {
				found = true;
				return;
			}
		});

	    if (this.moving) {
	    	//cursor won't show until mouse has moved, so must check for position change before setting or will have no icon or cursor on mouse down
	    	if (Math.abs(this.mouseX - event.pageX)>4 || Math.abs(this.mouseY - event.pageY)>4) {
	    		jQuery('body').css("cursor","none");
	    		jQuery("#"+this.noteMoving.id).css("display","none");
	    		jQuery(".responsivestickynotes-move-marker").css({"display":"block","top":event.pageY+"px","left":event.pageX+"px","pointer-events":"none"});
	    	}
	    	if (change) {

		    	this.cssString = this.getElementchain(this.baseElement);
		    	this.baseElement.addClass(markerClass);
		    }
		}

		
		if (this.adding) {
			var cl=this.baseElement.attr("class");
			if (cl != undefined && cl.indexOf("responsivestickynote") != -1) {
				return;
			}

			
		    if (change) {
				this.cssString = this.getElementchain(this.baseElement);
			    	this.baseElement.addClass(markerClass);
		    	var top =  this.baseElement.offset().top;
		    	var left = this.baseElement.offset().left-20;
		    	if (left < 10) left = 10;
		    	if (top < 10) top = 10;
				jQuery(".responsivestickynotes-add-marker").css({"display":"block","top":top+"px","left":left+"px"});
			}
		}

	},
	activateNote: function(elementChain) {
		var currentNote = null;
		for (var i=0;i<responsivestickynotes_obj.notes.length;i++) {
			var note = responsivestickynotes_obj.notes[i];
			if (note.elementChain == elementChain || jQuery(elementChain).attr('id')==note.id) {
				currentNote=note;
				break;
			}
		}
		if (currentNote!=null) {
			currentNote.open();
			return currentNote;
		}
		return false;
	},
	getBrowserCorrectChain: function(elementChain) {
		elementChain = responsivestickynotes_obj.stripTrailingHash(elementChain);

		var s = '';
		var prevS = '';
		var classList = elementChain.split(/>/).reverse();
		for (var i = 0;i<classList.length;i++) {

			//keep appending elements from end until an object cannot be formed from the string, then the previous string is the unique element
			//this will remove any divs added by browser plugins and remove the topmost div if it has been moved to a different nth-child position
			if (i>0) s = ">" + s;
			s = classList[i] + s;

			if (i==classList.length) {
				prevS = s;
				break;
			}

			var obj = jQuery(s);

			//only exit when nothing matches, not when there is only one match (or article tag may be missed)
			if (obj.length==0){
				break;
			}

			prevS = s;
		}

		var re = new RegExp('article#post-[0-9]+','i');
		var match = re.exec(elementChain);
		if (match != null && match.length> 0) {
			var match1 = re.exec(prevS);
			if (match1==null||match1.length==0) {
				//post, but has not matched up to the post id, which can happen if theme has formatted post differently. Add in the post id to ensure note attaches to post, not somewhere else in page
				prevS = match[0] + ' ' + prevS;
			}
		}

		if (prevS=='') {
			s='';
			//not found, so look for ID and use that exclusively
			for (var i = 0;i<classList.length;i++) {

				if (i>0) s = ">" + s;
				var cl = classList[i];
				var re = new RegExp('(.+):nth-child\\([0-9]+\\)(#.+)','i');
				var match = re.exec(cl);
				if (match != null && match.length> 0) {
					cl = match[1] + match[2];
				}
				s = cl + s;
				if (i==classList.length) {
					prevS = s;
					break;
				}
				var obj = jQuery(s);
				if (obj.length==0){
					break;
				}
				prevS = s;
			}
		}
		if (prevS=='') prevS = 'BODY'; //unattached notes go here and get position:fixed
		return prevS;
	},
	createNote: function(noteData) {
		var elementChain = noteData.elementChain;
		var postId = noteData.id;
		var text = noteData.text;
		var tooltip = noteData.tooltip;
		var admin_url = noteData.admin_url;
		var bgcol = noteData.bg_color;
		var col = noteData.color;
		var index= noteData.index;
		var note = new responsivestickynote(elementChain,tooltip, text, postId, admin_url, bgcol, col, index);
	},
	removeNote: function(id) {
		for (var i=0;i<this.notes.length;i++) {
			var note = this.notes[i];
			if (note.postId==id) {
				this.notes.splice(i,1);
				return;
			}
		}
	},
	//work up the dom until reaching either an article with an id, or the body tag, to set the element chain
	getElementchain: function(baseElement) {

		var className="";
	    var element = baseElement;

	    var css = [];
	    while (true) {//(element.attr("id") == undefined) {
	    	//look for unique class name on page and use that instead? no, in case it is used later elsewhere
	    	//get parent element
	    	var parent = element.parent();
	    	if (parent==undefined || parent.length==0)
	    		break;
	    	var count = 1;
	    	var found = false;
	    	var children = parent.children().each(function() {
	    		var t = jQuery(this);
	    		if (t[0]==element[0])
	    			found=true;
	    		if (found==false)
	    			count++;
	    	});

	    	var css_string = element[0].tagName;
	    	var complete = false;
	    	if (css_string=='ARTICLE' && element.attr("id") != undefined) {
	    		complete=true; //post
	    	}
	    	if (css_string=='BODY') {
	    		complete=true; //finished when body tag is found
	    	}
	    	if (!complete && children.length > 1)
	    		css_string += ":nth-child(" + count + ")";

	    	//look for id
		    if (element.attr("id") != undefined && element.attr("id").length > 0) {
		    	css_string += "#" + element.attr("id"); //necessary specifically for posts
		    }
		    //look for identifying body classname, this is the thing which ties notes to specific pages
		    var classList = element[0].className.split(/\s+/);
		    for (var i = 0; i < classList.length; i++) {
		    	var className = classList[i];
		    	if (className.indexOf('page-id') > -1 || className.indexOf('postid') > -1) {
		    		css_string += "." + className;
		    	}
		    }
	    	css.push(css_string);
	    	if (complete) break;
	    	element = parent;
	    }
		css.reverse();
		css_string='';
		var className = css[0];
		if (className.indexOf('page-id') == -1 && className.indexOf('postid') == -1 && className.indexOf('post-') == -1) {
			var pageId = responsivestickynotes_vars.pageId;
			css[0] = 'BODY.page-id-' + pageId.toString(); //in case body_class() missing

		}
		for (var i=0;i<css.length;i++) {
			css_string += css[i];
			if (i < css.length-1) {
				css_string += ">";
			}
		};
		return this.stripTrailingHash(css_string);
	},
	killHrefs: function() {
		jQuery("a[href]").each (function() {
			var obj = jQuery(this);
			if (!responsivestickynotes_obj.isAdminBar(obj)) {
				obj.attr("responsive-sticky-notes-oldhref",this.href);
				obj.attr("responsive-sticky-notes-oldtarget",this.target);
				this.href = "#";
				this.target = "";
			}
		});
	},
	restoreHrefs: function() {
        setTimeout(function() {
        	jQuery("a[href]").each (function() {

     			var attr = jQuery(this).attr("responsive-sticky-notes-oldhref");
     			if (attr != undefined && attr.length != 0) {
     				this.href = attr;
     				jQuery(this).attr("responsive-sticky-notes-oldhref", "");
     			}
				attr = jQuery(this).attr("responsive-sticky-notes-oldtarget");
				if (attr != undefined && attr.length != 0) {
					this.target=attr;
					jQuery(this).attr("responsive-sticky-notes-oldtarget", "");
				}
    		});
	     },1000);
	},
}

var selectedText = '';



//event handler for Add Note button
function responsivestickynotes_add_note(v_event = false, thisEvent = false) {
	(function($) {
		var baseElement = null;
		var markerClass = "responsivestickynotes-highlight-block";
		var canAddNote = false;
		selectedText=window.getSelection().toString();

		//stop initial button click from scrolling back to top
		var yScroll = $(window).scrollTop();
		$(window).one("scroll", function() {
			$(window).scrollTop(yScroll);
		});

		if (!responsivestickynotes_obj.started) {
			activate();
		}else {
			deactivate();
		}

		function activate() {
			responsivestickynotes_obj.started = true;
			responsivestickynotes_obj.adding = true;
			responsivestickynotes_obj.moving = false;

			//kill hrefs or links will fire if trying to add notes to them
			if(!v_event){
				$('body').on("click", addNoteEvent);
			}else{
				addNoteEvent(v_event, 'video', thisEvent);
			}
			

			//toggle hrefs to prevent links firing
			responsivestickynotes_obj.killHrefs();
			$("a").one("click", killScroll);
			$("a").css("cursor","default");
		}

		function deactivate() {

			responsivestickynotes_obj.started = false;
			responsivestickynotes_obj.adding = false;
			$('body').off("click", addNoteEvent);
			$("a").off ("click", killScroll);
			$("a").css("cursor","pointer");

			if (responsivestickynotes_obj.baseElement != null) responsivestickynotes_obj.baseElement.removeClass(markerClass);

			$(".responsivestickynotes-button-text-active").css("display","none");
			$(".responsivestickynotes-button-text").css("display","inline-block");
			$("li#wp-admin-bar-addnote a").blur();
			$(".responsivestickynotes-add-marker").css({"display":"none"});

			//restore old hrefs - but will fire if done straight away. Is there a better way of doing this?
			 responsivestickynotes_obj.restoreHrefs();
		}

		function killScroll() {
			//stop anchor click from scrolling back to top
			yScroll = $(window).scrollTop();
			$(window).one("scroll", function() {
				$(window).scrollTop(yScroll);
			});
		}
		function addNoteEvent(event, type = false, thisEvent = false) {
			
			if(event.target.id !== 'addnote-to-front-span' && event.target.id !== 'addnote-to-front'){
				if (!responsivestickynotes_obj.started) return;
				//if (!canAddNote) return;
				if (responsivestickynotes_obj.isAdminBar(jQuery(event.target))) {
					return;
				}
				deactivate();
				//close all notes
				responsivestickynotes_obj.notes.forEach (function(note) {
					note.close();
				});
				//new note
				var nextId = responsivestickynotes_vars.nextId; //post id of next draft note
				
				
				if(type == 'video' && responsivestickynotes_obj.cssString == ''){
					responsivestickynotes_obj.cssString = responsivestickynotes_object.prototype.getElementchain(jQuery(event.target));
					var currentTime = thisEvent.get(0).currentTime;
					var vName = thisEvent.attr('src');
					var vindex = vName.lastIndexOf("/") + 1;
					vName = vName.substr(vindex);
					vName = vName.replace(/\.[^/]+$/, "");
				}
				
				
				
				
				console.log('vName: ', vName);
				var s = responsivestickynotes_obj.getBrowserCorrectChain(responsivestickynotes_obj.cssString);
				if(selectedText === ''){
					selectedText=window.getSelection().toString();
				}
				var note = new responsivestickynote(s,'',selectedText, nextId);
				selectedText = '';
				var data = {
					'action'		: 'responsivestickynotes_new',
					'security'		: responsivestickynotes_vars.postNoteNonce,
					'id'			: nextId,
					'element_chain'	: responsivestickynotes_obj.cssString,
					'page'			: responsivestickynotes_vars.pageId,
					'current_time' 	: typeof currentTime != 'undefined' ? currentTime : '', 
					'v_name' 		: typeof vName != 'undefined' ? vName : ''
				};



				

				// since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
				$.ajax({
					url: ajaxurl,
					data: data,
					error: function(e) {
					//	error - remove note
						console.log("no id from server (error function) - removing note");
					},
					success: function(data) {

						console.log('test success data: ', data);
						if (data==="error") {
							//error - remove note
							console.log("no id from server (error message returned) - removing note");
						}
						else {
							//set up id for next new note
							//var arr = $.map(data_out, function(el) { return el });
							var obj = JSON.parse(data);
							responsivestickynotes_vars.nextId = obj.nextId;
							note.setTooltip(obj.tooltip);
							note.setAdminUrl(obj.admin_url);
							note.open();
						}
					},
					method: 'POST'
				});
				return;
			}
		}
	}) (jQuery);
}



// Set Cookies
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// Get Cookies
function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
	  let c = ca[i];
	  while (c.charAt(0) == ' ') {
		c = c.substring(1);
	  }
	  if (c.indexOf(name) == 0) {
		return c.substring(name.length, c.length);
	  }
	}
	return "";
}

//instantiate
var responsivestickynotes_obj = new responsivestickynotes_object();
jQuery(document).ready(function() {
	responsivestickynotes_obj.init();
});
