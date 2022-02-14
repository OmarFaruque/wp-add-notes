/**
 * responsive-sticky-note.js
 * class which encapsulates a single note
 */

//constructor
function responsivestickynote(elementChain, tooltip, text, postId, adminUrl, bgcol, col, index, v_name = false, current_time = false) {
	this.tooltip=tooltip;
	this.elementChain = elementChain;
	this.postId = postId;
	this.id='';
	this.index=index;
	this.adminUrl = adminUrl;
	this.obj = null;
	this.content = "";
	this.hasChanged = false;
	this.dialog = null;
	this.col = col;
	this.bgCol = bgcol;
	this.isAdmin = (this.adminUrl===null) ? false : true;
	this.menuHidden = true;
	this.v_name = v_name;
	this.current_time = current_time;
	var obj = jQuery("div#wpadminbar");
	this.adminBarH = (obj.length > 0) ? obj.outerHeight() : 0;
	this.add(text);
}

responsivestickynote.prototype = {

	add: function(text) {

		this.content = text;
		this.id='responsive-sticky-notes-' + this.postId;
		this.elementChain = responsivestickynotes_obj.stripTrailingHash(this.elementChain);
		this.obj = jQuery(this.elementChain);
		responsivestickynotes_obj.highestZ++;
		//appending to body rather than element, as certain elements (like img) cannot have content added so would have to use parent.
		//but also, if object is hidden then note will be as well, and all notes should be visible at all times
		//icon
		this.markerId = this.id + "-marker";
		var classIs = 'responsivestickynote responsivestickynotes-marker-container';

		var params = (new URL(document.location)).searchParams;
		var url_v_name = params.get("v");
		var url_current_time = params.get("t");

		if(this.v_name != false && this.current_time != false){
			classIs += ' v_note';
			classIs += (this.v_name == url_v_name && this.current_time == url_current_time) ? ' show' : '';
		}

		// list of time 
		if(this.v_name != false && this.current_time != false){
			var listElement = '<ul></ul>'
		}
		
		var d = '<div class="'+classIs+'" id="' +this.id + '" title="'+responsivestickynotes_vars.untitled_note +'" alt="'+responsivestickynotes_vars.untitled_note +'">';
		d += '<div class="responsivestickynote responsivestickynotes-marker1" id="' + this.markerId + '1" ></div>';
		d += '<div class="responsivestickynote responsivestickynotes-marker2" id="' + this.markerId + '2"></div>';
		d += '<div class="responsivestickynote responsivestickynotes-marker3" id="' + this.markerId + '3"></div>';
		d += '<div class="responsivestickynote responsivestickynotes-arrow1" id="' + this.markerId + '4"></div>';
		d += '<div class="responsivestickynote responsivestickynotes-arrow2" id="' + this.markerId + '5"></div>';
		d += '<div class="responsivestickynotes-marker-overlay"></div>';
		d += '</div>';
		//container
		this.containerId = this.id + "-container";
		d +='<div class="responsivestickynote responsivestickynotes-container" id="' + this.containerId + '">';
		if(this.index===undefined){
			d +='<h6>Note ID-New Note</h6>';
		}
		else{
			d +='<h6>Note ID-'+this.index+'</h6>';
		}

		//menu
		this.menuId = this.id + "-menu";
		d += '<div id=' + this.menuId + '>';
		d += '<div class="responsivestickynote responsivestickynotes-menu">';

		if (this.isAdmin===true)
		d += '<div class="responsivestickynote responsivestickynotes-menuicon responsivestickynotes-menuicon1" title="'+responsivestickynotes_vars.menu+'" alt="'+responsivestickynotes_vars.menu+'"></div>';
		d += '<div class="responsivestickynote responsivestickynotes-menuicon responsivestickynotes-menuicon2" title="'+responsivestickynotes_vars.close+'" alt="'+responsivestickynotes_vars.close+'"></div>';
		d += '</div>';
		this.menuHideId = this.id + "-menuhide";

		if (this.isAdmin===true) {
			//hidden menu
			d += '<div class="responsivestickynote responsivestickynotes-menuhide" id="' + this.menuHideId + '">';
			d += '<div style="display:table; width: 100%">';
			d += '<div class="responsivestickynote responsivestickynotes-menuicon responsivestickynotes-menuicon3" title="'+responsivestickynotes_vars.bin_note+'" alt="'+responsivestickynotes_vars.bin_note+'"></div><div class="responsivestickynote responsivestickynotes-menuicon responsivestickynotes-menuicon4" title="'+responsivestickynotes_vars.more+'" alt="'+responsivestickynotes_vars.more+'"></div>';

			for (var i=0;i<10;i++) {
				var cl="responsivestickynotes-coloricon" + i;
				var id = this.id + "-coloricon" + i;
				d += '<div class="responsivestickynotes-coloricon ' + cl + '" id="' + id + '" title="'+responsivestickynotes_vars.set_note_color+'" alt="'+responsivestickynotes_vars.set_note_color+'"></div>';
			}
			d+= '</div></div>';
		}
		d += '</div>';
		wp.editor.getDefaultSettings();
		//note
		this.noteAreaId = this.id + "-note";
		d += '<textarea class="responsivestickynote responsivestickynotes-note" id="'+this.noteAreaId+'" rows="4" cols="50">'+this.content+'</textarea>';
		d += '</div>';

		//Append Video Lists
		jQuery("body").append(d);
		wp.editor.initialize( this.noteAreaId ,{
			tinymce: {
				toolbar1: 'bold italic underline | alignleft aligncenter alignright | bullist numlist ' ,
			},
		});

		this.fixIfUnattached();

		var note = this;
		jQuery("#"+this.id).css("z-index",responsivestickynotes_obj.highestZ);

		jQuery("#"+this.id).on("click", function() {
			note.open();
		});
		if (this.isAdmin===true) {
			jQuery("#"+this.id).on("mousedown", function(e) {
				responsivestickynotes_obj.startMove(note, e);
			});
			jQuery("#"+this.menuId).on("mousedown", function(e) {
				responsivestickynotes_obj.startMove(note, e);
			});

			//add color change handlers
			for (var i=0;i<10;i++) {
				var id = this.id + "-coloricon"+i;
				jQuery("#"+id).on('click', function(e) {
					//get the color
					var bgcol = jQuery(this).css("background-color");
					var col = jQuery(this).css("color");
					note.setColor(col, bgcol);
					var data = {
						'action': 'responsivestickynotes_update_color',
						'security': responsivestickynotes_vars.postNoteNonce,
						'id':note.postId,
						'color':col,
						'bgcolor':bgcol
					};

					jQuery.ajax({
						url: ajaxurl,
						data: data,
						error: function(e) {
							console.log("error setting color " + e.statusText);
						},
						success: function(data) {

						},
						method: 'POST'

					});
				});
			}

			jQuery("#"+this.menuHideId).slideUp(0);

			window.tinymce.activeEditor.on('blur mouseenter',function(e){
				note.content = wp.editor.getContent(note.noteAreaId);
				note.hasChanged = true;
			});

			jQuery("#"+this.menuId + " .responsivestickynotes-menuicon4").on('click', function(e) {
			    window.location.href=note.adminUrl;
			});
			jQuery("#"+this.menuId + " .responsivestickynotes-menuicon1").on('click', function(e) {
			    note.toggleMenu();
			});
			jQuery("#"+this.menuId + " .responsivestickynotes-menuicon3").on('click', function(e) {
				if (confirm(responsivestickynotes_vars.delete_this_note))
					note.deleteNote();
			});
		}
		else {
			jQuery("#"+this.noteAreaId).attr("disabled","disabled");
		}
		jQuery("#"+this.containerId).hide();
		//text area of note event handlers
		jQuery("#"+this.noteAreaId).on('click', function(e) {
			note.sendToFront();
		});

		//also menu tab event handler
		jQuery("#"+this.menuId).on('click', function(e) {
			note.sendToFront();
		});

		//note button event handlers
		jQuery("#"+this.menuId + " .responsivestickynotes-menuicon2").on('click', function(e) {
		    note.close();
		});

		responsivestickynotes_obj.notes.push(this); //so first note is not behind the marker, must push it before sendToFront() called

		this.setColor(this.col, this.bgCol);
		this.setBasePosition();
		this.move(); //will scroll to bottom of page without this??
		// this.conditionChecking();
		this.checkForChanges();
		this.setTooltip();
	},
	// conditionChecking: function(){
	// 	if(this.content==''){
	// 		this.checkForChanges();
	// 	}
	// 	else{
	// 		this.saveContents();
	// 	}
	// },
//changing the color of the sticky note
	setColor: function(col, bgcol) {
		if (col===undefined||col=="") {
			col = 'rgb(0,0,0)';
		}
		if (bgcol===undefined|bgcol=="") {
			bgcol = 'rgb(255,255,150)';
		}
		jQuery("#"+this.containerId).css("background-color",bgcol);
		jQuery("#"+this.noteAreaId).css("color",col);
		jQuery("#"+this.markerId+'1').css("background-color",bgcol);
		jQuery("#"+this.markerId+'2').css("background-color",bgcol);
		jQuery("#"+this.markerId+'3').css("background-color",bgcol);
		col='#000';
		jQuery("#"+this.markerId+'1').css("border-color",col);
		jQuery("#"+this.markerId+'2').css("border-color",col);
		jQuery("#"+this.markerId+'3').css("border-color",col);
		jQuery("#"+this.markerId+'4').css("border-bottom-color",col);
		jQuery("#"+this.markerId+'5').css("border-bottom-color",bgcol);
		for (var i=0;i<10;i++) {
			var cl=".responsivestickynotes-coloricon" + i;
			var _bgcol = jQuery(cl).css("background-color");
			jQuery(cl).css("border-color","#808080");
			if (_bgcol==bgcol) {
				jQuery(cl).css("border-color",col);
			}
		}
	},
//to toggle hide & show the menu shown in the sticky note
	toggleMenu: function() {
		if (this.menuHidden==true) {
			jQuery("#"+this.menuHideId).slideDown(500);
		}
		else {
			jQuery("#"+this.menuHideId).slideUp(500);
		}
		this.menuHidden = !this.menuHidden;
	},

	setAdminUrl: function(adminUrl) {
		this.adminUrl = (adminUrl!==undefined) ? adminUrl : this.adminUrl;
	},
	setTooltip: function(tooltip) {
		this.tooltip = (tooltip!==undefined) ? tooltip : this.tooltip;
		jQuery('#' + this.id).prop("title", this.tooltip);
		jQuery('#' + this.id).prop("alt",this.tooltip);
	},
//Checking if the hasChanged variable, when content is added in the note hasChanged=true
	checkForChanges: function() {
		var note = this;
		if (note.hasChanged) {
			note.hasChanged = false;
			note.saveContents();
		}
		else {
	        setTimeout(function() {
	            note.checkForChanges();
	        },100);
		}
	},
	saveContents: function() {
		var note = this;
		var data = {
			'action': 'responsivestickynotes_update',
			'security': responsivestickynotes_vars.postNoteNonce,
			'id':this.postId,
			'content':note.content
		};
		jQuery.ajax({
			url: ajaxurl,
			data: data,
			error: function(e) {
				console.log("error saving note (1) " + e.statusText);
				note.hasChanged = true;
		         setTimeout(function() {
		             note.checkForChanges();
		         },1000);
			},
			success: function(data) {
				if (data=="error") {
					note.hasChanged = true;
					console.log("error saving note (2)");
				}
				note.setTooltip(data.trim());
		        setTimeout(function() {
		            note.checkForChanges();
		        },1000);
			},
			method: 'POST'
		});
	},
	setBasePosition: function() {
		if (this.obj.offset() != undefined) {
			this.top = this.obj.offset().top;
			this.left = this.obj.offset().left - 24;
			if (this.top < 5+ this.adminBarH) this.top = 5+ this.adminBarH;
			if (this.left < 5) this.left = 5;
		}
	},
	move: function() {
		jQuery("#"+this.id).css({"left":this.left+"px","top":this.top+"px"});// = offsetLeft - 20;
		var left = this.left;
		var top=this.top-1;
		jQuery("#"+this.containerId).css({"left":left+"px","top":top+"px"});// = offsetLeft - 20;
	},
	open: function() {

		if (this.active) return;
		jQuery("#"+this.containerId).show(400);
		jQuery("#"+this.noteAreaId).focus();
		this.sendToFront();
		this.active = true;
	},
	close: function() {
		if (!this.active) return;
		jQuery("#"+this.containerId).hide(400);
		this.active = false;
	},
	deleteNote: function() {
		var data = {
			'action': 'responsivestickynotes_delete',
			'security': responsivestickynotes_vars.postNoteNonce,
			'id': this.postId
		};
		// since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
		jQuery.ajax({
			url: ajaxurl,
			data: data,

			error: function() {
			//	error
			},
			success: function(data) {
				if (data=="error") {
					//error
				}
				else {
					// silence
				}
			},
			method: 'POST'
		});

		for (var i=0;i<responsivestickynotes_obj.notes.length;i++) {
			var note = responsivestickynotes_obj.notes[i];
			if (note==this) {
				responsivestickynotes_obj.notes.splice(i,1);
				break;
			}
		}

		jQuery("#"+this.id).remove(); //marker
		jQuery("#"+this.containerId).remove(); //note
	},
	sendToFront: function() {
		//markers are dynamically re-ordered using responsivestickynotes_obj.highestZ, so that cannot be used here
		var topPos = 0;
		for (var i=0;i<responsivestickynotes_obj.notes.length;i++) {
			var note = responsivestickynotes_obj.notes[i];
			var zIndex = parseInt(jQuery("#"+note.id).css("z-index"),10);
			if (zIndex && zIndex > topPos) topPos = zIndex;
			if (note != this && note.active) {
				zIndex = parseInt(jQuery("#"+note.containerId).css("z-index"),10);
				if (zIndex && zIndex > topPos) topPos = zIndex;
			}
		}
		topPos++;
		jQuery("#"+this.containerId).css("z-index", topPos);
	},
	stopMove: function () {
		jQuery("#"+this.id).css("display","block");
		if (responsivestickynotes_obj.cssString == "html" || responsivestickynotes_obj.cssString == "HTML") return;
		if (responsivestickynotes_obj.cssString.indexOf("#responsive-sticky-notes-") == -1) { //if note has not been moved, will have a 'note' element string
			this.changeBaseElement(responsivestickynotes_obj.cssString);
		}
	},
	fixIfUnattached: function() {
		if (this.elementChain=='BODY') {
			jQuery('#'+this.id).css("position","fixed");
			jQuery('#'+this.containerId).css("position","fixed");
		}
		else {
			jQuery('#'+this.id).css("position","absolute");
			jQuery('#'+this.containerId).css("position","absolute");
		}
	},
	changeBaseElement: function(elementChain) {

		this.elementChain = responsivestickynotes_obj.stripTrailingHash(elementChain);
		this.fixIfUnattached();
		this.obj = jQuery(this.elementChain);
		this.setBasePosition();
		this.move();
		var note = this;
		var data = {
			'action': 'responsivestickynotes_update_elementchain',
			'security': responsivestickynotes_vars.postNoteNonce,
			'id':note.postId,
			'elementchain':note.elementChain
		};

		jQuery.ajax({
			url: ajaxurl,
			data: data,
			error: function() {
				console.log("error changing base element (1)" + note.postId);
			},
			success: function(data) {
				if (data=="error") {
					console.log("error changing base element (2)" + note.postId);
				}
			},
			method: 'POST'
		});
	},
};