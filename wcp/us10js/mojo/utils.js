define("mojo/utils", [
    "dojo/_base/lang",
    "dojo/query",
    "dojo/dom",
    'dojo/on',
    "dojo/_base/window",
    'dojo/_base/html',
    'dojo/dom-construct',
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/request/xhr",
    "dojo/topic",
    "dojo/keys",
    "dojo/fx",
    "dojo/fx/Toggler",
    "dojo/_base/array",
    "dijit/registry",
    "dojo/dom-geometry",
    "dojo/ready",
    "dojox/xmpp/util",
    "velocity/velocity",
    "dojox/html/entities",
    "dojo/NodeList-traverse"
], function(lang, query, dom, on, win, html, domConstruct, domClass, domStyle, domAttr, xhr, topic, keys, fx, Toggler, array, registry, domGeom, ready, xmpputil, Velocity, htmlEntities) {
    var browserPrefix = null;

    var utils = {
        /**
         * Quick Select All
         * @param {string||domNode} idOrDom the element id to focus and select all on
         */
        selectAll: function(idOrDom) {
            var obj = typeof idOrDom == "string" ? document.getElementById(idOrDom) : idOrDom;
            obj.focus();
            obj.select();
        },

        /**
         * Absolutely position the merge box above the label
         */
        updateMergeBox: function(mergebox, label) {
            var label_coords = dojo.coords(label, true);
            var body = document.body;
            var try_parent = mergebox.parentNode;
            while(try_parent != body) {
                if(domStyle.get(try_parent, 'position') && domStyle.get(try_parent, 'position') != 'static') { break; }
                try_parent = try_parent.parentNode;
            }

            if(!dojo.isIE) {
                mergebox.style.bottom = (dojo.coords(try_parent).h - label_coords.t) + 'px';
            }
        },

        /**
         * Toggle using dojo.fx.wipeIn/Out an element on the basis of a checkbox
         * @param {dijit.form.CheckBox} checkbox the checkbox to use as a toggle switch
         * @param {String} id the id of the element to toggle
         */
        wipeToggle: function(checkbox, id) {
            require(["dojo/fx"], function(fx) {
                var anim;
                if(checkbox.checked) {
                    anim = fx.wipeIn({'node': dom.byId(id), 'duration': 500});
                } else {
                    anim = fx.wipeOut({'node': dom.byId(id), 'duration': 500});
                }
                anim.play();
            });
        },

        /**
         * Do a simple accordion toggle where we will toggle on the {active_id} element, and toggle
         * off all other elements with class "accordion-switch"
         * @param {String} active_id the id of the new active accordion element
         * @param {Integer} animationDuration the duration of the accordion animation
         */
        toggleAccordion: function(active_id, animationDuration) {
            require(['dojo/fx'], function(fx) {
                // Set default animation to always be 500ms
                animationDuration = typeof animationDuration !== 'undefined' ? animationDuration : 500;

                var animations = query('.accordion-switch').map(function(el){
                    if(el.id == active_id) {
                        return fx.wipeIn({'node': el, 'duration': animationDuration});
                    } else {
                        return fx.wipeOut({'node': el, 'duration': animationDuration});
                    }
                });

                if(dom.byId('merges-list')) {
                    var mergebox = dom.byId('merges-list');
                    var label = query('.merge-cheatsheet label')[0];
                    array.forEach(animations, function(anim) {
                        dojo.connect(anim, 'onEnd', function() {
                            utils.updateMergeBox(mergebox, label);
                        });
                    });
                }

                //If an accordion-active element exists, assume it is a hidden input field to store the active accordion panel
                if(dom.byId('accordion-active')) {
                    dom.byId('accordion-active').value = active_id;
                }

                fx.combine(animations).play();
            });
        },

        /**
         * Toggle show/hide of a given element, with the disclosure classes added and removed from the target element
         */
        disclosureElement: function(id, target, show_hide, callback, disclosure_button) {
            var el = dom.byId(id);
            var showText = new RegExp('show ', 'gi');
            var hideText = new RegExp('hide ', 'gi');
            if(el.style.display == 'none') {
                el.style.display = 'block';
                if (disclosure_button !== "button") {
                    domClass.remove(target, 'disclosure-closed');
                    domClass.add(target, 'disclosure-open');
                }
                if(show_hide) {
                    target.innerHTML = target.innerHTML.replace(showText, 'hide ');
                }
                if(typeof(callback) == 'function') callback('open');
            } else {
                el.style.display = 'none';
                if (disclosure_button !== "button") {
                    domClass.remove(target, 'disclosure-open');
                    domClass.add(target, 'disclosure-closed');
                }
                if(show_hide) {
                    target.innerHTML = target.innerHTML.replace(hideText, 'show ');
                }
                if(typeof(callback) == 'function') callback('close');
            }
        },

        /**
         * Launch a modal dialog window that will show a help video and automatically start playing it
         * @param {String} name the name of the video to show
         */
        showHelpVideo: function(name) {
            require(["mojo/widgets/HelpDialog", "dojo/_base/window"], function(HelpDialog, win) {
                var dialog = dijit.byId('help-video-modal-' + name);
                if(!dialog) {
                    var dialog_node = document.createElement('div');
                    dialog_node.id = 'help-video-modal-' + name;
                    var placeholder = document.createElement('div');
                    placeholder.id = 'help-video-embed-' + name;
                    placeholder.style.height = '427px';
                    placeholder.style.width = '640px';
                    dialog_node.appendChild(placeholder);
                    var webinar_link = document.createElement('p');
                    webinar_link.style.margin = '0 0 0 0';
                    webinar_link.style.textAlign = 'left';
                    webinar_link.innerHTML = '<a href="http://mailchimp.com/support/online-training/" target="_blank" style="text-align:center;">Watch other helpful training videos.</a>';
                    dialog_node.appendChild(webinar_link);

                    win.body().appendChild(dialog_node);
                    dialog = new HelpDialog({
                        'title': 'MailChimp Help Videos',
                        'id': 'help-video-modal-' + name
                    }, dialog_node);
                    pHtml = '<iframe width="640" height="427" src="https://fast.wistia.com/embed/medias/'+name+'?controlsVisibleOnLoad=true&autoPlay=true" frameborder="0"></iframe>';
                    document.getElementById('help-video-embed-' + name).innerHTML = pHtml;
                }

                dialog.show();

                //If we're on Firefox on the Mac, remove the underlay since a transparent element will destroy the flash video
                if(dojo.isMozilla && navigator.userAgent.toLowerCase().indexOf('mac') != -1) {
                    dialog._underlay.domNode.style.display = 'none';
                }
            });
        },

        /**
         * Use SWFObject to actually embed the flash video in the dialog placeholder
         * ... not used now, but leaving this in here in case we need to do something awful like
         *     this again in the future.
         */
        loadHelpVideo: function(name) {
            try {
                if(typeof brightcove == "undefined") {
                    isLoaded = false;
                } else {
                    isLoaded = true;
                }
            }catch(e){
                isLoaded = false;
            }
            if (!isLoaded){
                var head= document.getElementsByTagName('head')[0];
                var script= document.createElement('script');
                script.type= 'text/javascript';
                script.src= 'http://admin.brightcove.com/js/BrightcoveExperiences.js';
                head.appendChild(script);
                setTimeout(function() { loadHelpVideo(name); }, 500);
                return;
            }

            var bc_params = {};
            bc_params["id"] = "myExperience";
            bc_params["bgcolor"] = "#FFFFFF";
            bc_params["width"] = 650;
            bc_params["height"] = 550;
            bc_params["playerId"] = 730557335001;
            bc_params["@videoPlayer"] = name;
            bc_params["@playlistTabs"] = "1375780129,1375772162,1375780130,1485827977"; // String, not number, trust me
            bc_params["@playlistTabs.featured"] = null;

            var pHtml = "\n\n<!-- Start Brightcove Player -->";
            pHtml += "\n<object id=\"myExperience\" class=\"BrightcoveExperience\">";
            pHtml += "\n<param name=\"bgcolor\" value=\"" + bc_params["bgcolor"] + "\" />";
            pHtml += "\n<param name=\"width\" value=\"" + bc_params["width"] + "\" />";
            pHtml += "\n<param name=\"height\" value=\"" + bc_params["height"] + "\" />";
            pHtml += "\n<param name=\"playerID\" value=\"" + bc_params["playerId"] + "\" />";

            // Start Assigning Programming
            if(bc_params["@videoPlayer"] != null) {
                pHtml += "\n<param name=\"@videoPlayer\" value=\"" + bc_params["@videoPlayer"] + "\" />";
            } else if(bc_params["@playlistTabs"] != null) {
                pHtml += "\n<param name=\"@playlistTabs\" value=\"" + bc_params["@playlistTabs"] + "\" />";
                if(bc_params["@playlistTabs.featured"] != null) { pHtml += "\n<param name=\"@playlistTabs.featured\" value=\"" + bc_params["@playlistTabs.featured"] + "\" />"; }
                if(bc_params["@videoList.featured"] != null) { pHtml += "\n<param name=\"@videoList.featured\" value=\"" + bc_params["@videoList.featured"] + "\" />"; }
            }
            // End Assigning Programming

            pHtml += "\n<param name=\"isVid\" value=\"true\" />";
            pHtml += "\n<param name=\"isUI\" value=\"true\" />";
            pHtml += "\n</object>";
            pHtml += "\n<!-- End Brightcove Player -->\n\n";
            document.getElementById('help-video-embed-' + name).innerHTML = pHtml;

            var i = 0;
            //this is awful if it execes, so were are attempting to preload in app/lib/MC/ViewHandler/HelpVideo.php
            while(1){
                try{
                    if (brightcove==undefined){}
                    else { break; }
                }catch (e){}
                i++;
                if (i>10000) break;
            }
            brightcove.createExperiences('0', 'myExperience');
        },

        creditCardField: function(field_id, image_id, cardtype_url) {
            var field = dom.byId(field_id);
            var image = dom.byId(image_id);

            //Closure variable to store the first four digits for caching
            var first_four = '';
            dojo.connect(field, 'onkeyup', function(e) {
                if(field.value.length >= 4 && field.value.substr(0, 4) != first_four) {
                    //If we have at least 4 characters, replace the type image
                    first_four = field.value.substr(0, 4);
                    dojo.xhrGet({
                        'url': cardtype_url + '?num=' + field.value.substr(0, 4),
                        'handleAs': 'text',
                        'load': function(html) {
                            image.innerHTML = html;
                        }
                    });
                }
            });
        },

        countrySelectField: function(field_id, state_province_field_id, url) {
            var field = dom.byId(field_id);
            var state_province_field = dom.byId(state_province_field_id);

            // check on initialization, handles form post results nicely
            dojo.xhrGet({
                'url': url + '?id=' + field.value,
                'handleAs': 'text',
                'load': function(result) {
                    var display = result == 'N' ? 'none':'block';
                    domStyle.set(dom.byId(state_province_field_id), 'display', display);
                }
            });

            dojo.connect(field, 'onchange', function(e) {
                dojo.xhrGet({
                    'url': url + '?id=' + field.value,
                    'handleAs': 'text',
                    'load': function(result) {
                        var display = result == 'N' ? 'none':'block';
                        domStyle.set(dom.byId(state_province_field_id), 'display', display);
                    }
                });
            });
        },

        zipToStateField: function(zip_field_id, state_field_id, zip_to_state_url) {
            var zip_field = dom.byId(zip_field_id);
            var state_field = dom.byId(state_field_id);
            dojo.connect(zip_field, 'onkeyup', function(e) {
                var val = zip_field.value;
                if (val && val.length >= 5) {
                    dojo.xhrGet({
                        'url': zip_to_state_url + '?zip=' + zip_field.value,
                        'handleAs': 'text',
                        'load': function(state) {
                            if (state) {
                                state_field.value = state;
                            }
                        }
                    });
                }
            });
        },

        validationError: function(field, msg) {
            utils.clearValidation(field);
            var invalid_msg = document.createElement('span');
            domClass.add(invalid_msg, 'invalid-error');
            invalid_msg.appendChild(document.createTextNode(msg));
            field.parentNode.insertBefore(invalid_msg, field.nextSibling);
        },

        clearValidation: function(field) {
            var test_field = field.nextSibling;
            if(dojo.hasClass(test_field, 'invalid-error')) {
                test_field.parentNode.removeChild(test_field);
            }
        },

        log: function(str){
            try {
                console.log(str);
            } catch(e){}
        },

        /**
         * Add an option to a Select Input - helper for moveOptions
         * @param sel a select input to be added to
         * @param txt the new option text
         * @param txt the new option value
         */
        addOption: function(sel, txt, val){
            var new_opt = new Option(txt, val);
            sel.options[sel.length] = new_opt;
        },

        /**
         * Delete an option from a Select Input - helper for moveOptions
         * @param sel a select input
         * @param idx the index of the element to remove
         */
        deleteOption: function(sel, idx){
            if(sel.length>0) {
                sel.options[idx] = null;
            }
        },

        /**
         * Move selected options from one select input to another
         * @param from a select input
         * @param to a select input
         */
        moveOptions: function (from, to) {
            var selectedText = [];
            var selectedValues = [];
            var selectedCount = 0;

            var i;

            // Find the selected Options in reverse order
            // and delete them from the 'from' Select.
            for (i = from.length - 1; i >= 0; i--) {
                if (from.options[i].selected) {
                    selectedText[selectedCount] = from.options[i].text;
                    selectedValues[selectedCount] = from.options[i].value;
                    utils.deleteOption(from, i);
                    selectedCount++;
                }
            }

            // Add the selected text/values in reverse order.
            // This will add the Options to the 'to' Select
            // in the same order as they were in the 'from' Select.
            for (i = selectedCount - 1; i >= 0; i--) {
                utils.addOption(to, selectedText[i], selectedValues[i]);
            }
        },

        /**
         * Move all options from one select input to another, regardless of selected status
         * @param from a select input
         * @param to a select input
         */
        moveAllOptions: function (from, to) {
            var selectedText = [];
            var selectedValues = [];
            var selectedCount = 0;

            var i;

            // Find the selected Options in reverse order
            // and delete them from the 'from' Select.
            for (i = from.length - 1; i >= 0; i--) {
                selectedText[selectedCount] = from.options[i].text;
                selectedValues[selectedCount] = from.options[i].value;
                utils.deleteOption(from, i);
                selectedCount++;
            }

            // Add the selected text/values in reverse order.
            // This will add the Options to the 'to' Select
            // in the same order as they were in the 'from' Select.
            for (i = selectedCount - 1; i >= 0; i--) {
                utils.addOption(to, selectedText[i], selectedValues[i]);
            }
        },

        /**
         * Clears the to list and copies all options from from list to it.
         * @param from a select input
         * @param to a select input
         */
        copyAllOptions: function (from, to) {
            utils.removeAllOptions(to);
            for (var i = 0; i < from.length; i++) {
                utils.addOption(to, from.options[i].text, from.options[i].value);
            }
        },

        /**
         * Remove all options from one select input to another, regardless of selected status
         * @param from a select input
         * @param to a select input
         */
        removeAllOptions: function (sel) {
            for (var i = sel.length - 1; i >= 0; i--) {
                utils.deleteOption(sel, i);
            }
        },

        checkAll: function(form){
            query('input[type="checkbox"]', dom.byId(form)).forEach(function(el){
                domAttr.set(el, 'checked', 'checked');
            });
        },

        uncheckAll: function(form){
            query('input[type="checkbox"]', dom.byId(form)).forEach(function(el){
                domAttr.remove(el, 'checked');
            });
        },

        /**
         * Given a series of css selectors, toggle the display state for each one
         */
        toggle: function() {
            array.forEach(arguments, function(arg) {
                query(arg).forEach(function(el) {
                    if(domStyle.get(el, 'display') == 'none') {
                        domStyle.set(el, 'display', '');
                    } else {
                        domStyle.set(el, 'display', 'none');
                    }
                });
            });
        },

        checkPopupWin: function(win){
            if (!win || win.closed || typeof win.closed === 'undefined') {
                dijit.byId('popup-win-blocked').show();
            } else {
                win.focus();
            }
            return false;
        },

        getCookie: function(check_name) {
            var a_all_cookies = document.cookie.split(';');
            var a_temp_cookie = '';
            var cookie_name = '';
            var cookie_value = '';
            var b_cookie_found = false;

            for (i = 0; i < a_all_cookies.length; i++){
                a_temp_cookie = a_all_cookies[i].split( '=' );
                cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');
                if (cookie_name == check_name) {
                    b_cookie_found = true;
                    if (a_temp_cookie.length > 1) {
                        cookie_value = unescape(a_temp_cookie[1].replace(/^\s+|\s+$/g, ''));
                    }
                    return cookie_value;
                }
                a_temp_cookie = null;
                cookie_name = '';
            }

            if (!b_cookie_found) {
                return null;
            }
        },

        checkInputLength: function(input, to_update, len) {
            // Count characters the way humans would, with emoji as a single character.
            // via https://mathiasbynens.be/notes/javascript-unicode
            var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
            var count = input.value.replace(regexAstralSymbols, '_').length;

            var remain = len-count;
            var update_el = dom.byId(to_update);
            update_el.innerHTML = remain;
            if (remain < 10){
                domAttr.set(update_el.parentNode,'class','error-text small-meta char-count float-right');
            } else if (remain < 25){
                domAttr.set(update_el.parentNode,'class','warning-text small-meta char-count float-right');
            } else {
                domAttr.set(update_el.parentNode,'class','success-text small-meta char-count float-right');
            }
        },

        setCleanFileName: function (el){
            var name = htmlEntities.encode(el.value.replace('C:\\fakepath\\',''));
            //gross
            el.parentNode.parentNode.children[1].innerHTML = name;
        },

        formatFileSize: function(filesize) {
            //borrowed from http://snipplr.com/view/5949/
            if (filesize >= 1073741824) {
                filesize = utils.numberFormat(filesize / 1073741824, 2, '.', '') + ' Gb';
            } else {
                if (filesize >= 1048576) {
                    filesize = utils.numberFormat(filesize / 1048576, 2, '.', '') + ' Mb';
                } else {
                    if (filesize >= 1024) {
                        filesize = utils.numberFormat(filesize / 1024, 0) + ' Kb';
                    } else {
                        filesize = utils.numberFormat(filesize, 0) + ' bytes';
                    }
                }
            }
            return filesize;
        },

        numberFormat: function(number, decimals, dec_point, thousands_sep ) {
            // http://kevin.vanzonneveld.net
            // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
            // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // +     bugfix by: Michael White (http://crestidg.com)
            // +     bugfix by: Benjamin Lupton
            // +     bugfix by: Allan Jensen (http://www.winternet.no)
            // +    revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
            // *     example 1: number_format(1234.5678, 2, '.', '');
            // *     returns 1: 1234.57
            // * we grabbed from http://snipplr.com/view/5945/javascript-numberformat--ported-from-php/
            var n = number, c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
            var d = typeof(dec_point) == "undefined" ? "," : dec_point;
            var t = typeof(thousands_sep) == "undefined" ? "." : thousands_sep, s = n < 0 ? "-" : "";
            var i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;

            return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
        },

        /*
         * Show template selection overlay
         * @param index of the template clicked
         * @param instances of all templates
         */
         showTemplateActions: function (index, templates) {
            var cards = templates;
            array.forEach(cards, function (c, idx) {
                if (idx === index) {
                    domClass.toggle(c.firstElementChild, "card-clicked");
                } else {
                    domClass.remove(c.firstElementChild, "card-clicked");
                }
            });
         },

        /*
        * Select Template
        * @param index of the select-button clicked
        * @param instances of all templates
        * @param instances of all select-buttons
        */
        selectTemplate: function (index, templates, buttons) {
            var cards = templates;
            array.forEach(cards, function (c, idx) {
                if (idx === index) {
                    domClass.toggle(c, "card-selected");
                } else {
                    domClass.remove(c, "card-selected");
                }
                if (domClass.contains(c, "card-selected")) {
                    buttons[idx].innerHTML = "Selected";
                } else {
                    buttons[idx].innerHTML = "Select";
                }
            });
        },

        /*
        * Make headers stick to the top of the page
        * upon scrolling past the provided element id.
        * @param Element ID that needs to be sticky
        * @param Any other class that needs to be sticky
        */
        makeHeaderSticky: function (id, elClass) {
            var el = dojo.byId(id);
            var anyClass = dojo.query("." + elClass)[0];
            var coords = html.coords(el);
            var offsetY;
            if (utils.getCurrentBreakpoint() === "tablet" || utils.getCurrentBreakpoint() === "xltablet") {
                on(window, "scroll", function () {
                    offsetY = window.scrollY;
                    checkOffset();
                });
            }

            function checkOffset() {
                if (offsetY > coords.y) {
                    el.style.position = "fixed";
                    el.style.boxShadow = "0 3px 0 0 rgba(0, 0, 0, 0.03)";
                    el.style.top = "60px";
                    anyClass.style.position = "fixed";
                    anyClass.style.right = 30 + "px";
                    anyClass.style.top = 66 + "px";
                } else {
                    el.style.position = "absolute";
                    el.style.boxShadow = "none";
                    el.style.top = 0;
                    anyClass.style.position = "absolute";
                    anyClass.style.right = 0;
                    anyClass.style.top = 0;
                }
            }
        },

        /*
         * Show an element that has been hidden using display:none in style attribute of element
         * @param id of element we want to show
         */
        show: function(id, d){
            if(domStyle.get(id, "display") === "none") {
                Velocity(query("#" + id), "stop");
                Velocity(query("#" + id), "fadeIn", {duration: d ? +d : 225});
            }
        },

        /*
         * Hide an element using its element id
         * @param id of element we want to hide
         */
        hide: function(id, d){
            if(domStyle.get(id, "display") != "none") {
                Velocity(query("#" + id), "stop");
                Velocity(query("#" + id), "fadeOut", {duration: d ? +d : 225});
            }
        },

        /*
         * Hide an element using a class
         * @param class of element we want to hide
         */
        hideByClass: function(elclass){
            var el = query('.'+elclass)[0];
            if(el) {
                domClass.add(el, 'hide');
            }
        },

        /*
         * Toggles (hide/show) an element. You can provide custom text for hide/show states to the link/element triggering the hide/show action.
         * @param element triggering the hide/show, usually is a link
         * @param id of element that will be toggled
         * @param text of element triggering the toggle when target element is hidden. Passing NULL will not update innerHTML
         * @param text of element triggering the toggle when target element is shown. Passing NULL will not update innerHTML
         */
        toggleEl: function (self, id, showText, hideText) {
            var _self = self;
            var nodeAnimation;

            if (domStyle.get(id, "display") === "none") {
                nodeAnimation = "slideDown";
            } else {
                nodeAnimation = "slideUp";
            }
            // Important to stop so that all calls bound to this node are removed from queue
            // otherwise the calls accumulate and animations stack up with each click
            Velocity(query("#" + id), "stop");
            Velocity(query("#" + id), nodeAnimation,
                { duration: 225,
                  complete: function(){
                      if(showText && nodeAnimation == "slideUp"){
                          _self.innerHTML = showText;
                      }
                      if(hideText && nodeAnimation == "slideDown"){
                          _self.innerHTML = hideText;
                      }
                  }
                });
        },

        showHide: function(id){
            if(domStyle.get(id, "display") === "none") {
                domStyle.set(id, "display", "block");
            } else if(domStyle.get(id, "display") === "block") {
                domStyle.set(id, "display", "none");
            }
        },

        moveFlashBlock: function(domNode) {
            domConstruct.place('av-flash-block', domNode, 'first');
        },

        toast: function(message, type) {
            if(!type) type = 'message';
            topic.publish('show-toast', {
                'message': message,
                'type': type
            });
        },

        /**
         * Reset a form and all the Dijit widgets in it
         * @param {node} The node for them form element that needs to be reset
         */
        resetForm: function(node) {
            node.reset();
            query('.invalid', node).forEach(function(el){
                domClass.remove(el, 'invalid');
            });
            array.forEach(registry.findWidgets(node), function(widget){
                widget.reset();
            });
        },

        /**
         * Handle displaying errors to a form. Given a form and an error map, append error messages after the input.
         * @param form
         * @param errors
         */
        showFormErrors: function(form, errors) {
            form = query(form)[0];
            query('.invalid-error', form).remove();
            query('.invalid', form).removeClass('invalid');

            for(var name in errors) {
                if(errors.hasOwnProperty(name)) {
                    var input = query('[name=' + name + ']', form);
                    if(input) {
                        utils.addError(input[0], errors[name]);
                    }
                }
            }
        },

        addError: function(input, msg) {
            utils.removeErrors(input);
            query(input).addClass('invalid');
            domConstruct.place("<span class='invalid-error'>" + msg + "</span>", input, "after");
        },

        removeErrors: function(input) {
            query(input).siblings('.invalid-error').remove();
        },

        getTabletNaviHeight: function() {
            var tableNavi = query('.tablet-nav')[0];
            if (tableNavi) {
                return domGeom.position(tableNavi).h;
            } else {
                return 0;
            }
        },

        getAppScrollContainer: function() {
            var appScrollContainer = dojo.body();
            if (domAttr.get(appScrollContainer, "id", "popup")) {
                appScrollContainer = win.body();
            }
            return appScrollContainer;
        },

        updateQueryStringParameter: function(uri, key, value) {
            var re = new RegExp("([?|&])" + key + "=.*?(&|$)", "i");
            var separator = uri.indexOf('?') !== -1 ? "&" : "?";
            if (uri.match(re)) {
                return uri.replace(re, '$1' + key + "=" + value + '$2');
            }
            else {
                return uri + separator + key + "=" + value;
            }
        },

        prefixAnimationEvents: function(eventStr) {
            var prefixes = ['webkit', 'Moz', 'MS', ''];

            if(browserPrefix == null) {
                var p = domConstruct.create('p');
                var pStyles = p.style;
                browserPrefix = false;
                array.some(prefixes, function(prefix) {
                    var attr = prefix ? prefix + 'Animation' : 'animation';
                    if(typeof(pStyles[attr]) !== 'undefined') {
                        browserPrefix = prefix;
                        return true;
                    } else {
                        return false;
                    }
                });
                domConstruct.destroy(p);
            }

            if(browserPrefix !== false) {
                // Browsers besides webkit uses all lowercase non-browser specific. (ex. webkitAnimationEnd vs. animationend)
                if(browserPrefix && browserPrefix == 'webkit') {
                    return browserPrefix + utils.capitalize(eventStr);
                } else {
                    return eventStr.toLowerCase();
                }
            } else {
                return false;
            }
        },

        capitalize: function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        },

        uncapitalize: function(str) {
            return str.charAt(0).toLowerCase() + str.slice(1);
        },

        plural : function(value, str) {
            return (parseInt(value) === 1 ? str : str + 's');
        },

        getDocScroll: function() {
            // Returns document scroll, and account for Tablet navi height if needed
            var scrollTopValue = domGeom.docScroll().y;
            if (window.innerWidth <= 1024) {
                scrollTopValue += utils.getTabletNaviHeight();
            }
            return scrollTopValue;
        },

        getAvailableBreakpoints: function() {
            // Returns a list of breakpoint name from mcvariables.less
            return breakpointsArray = dojo.getStyle(dojo.query('head *')[0], "font-family").split("\'").join("").split(",");
        },

        getCurrentBreakpoint: function() {
            // Returns the current breakpoint name. Gets applied as a fake font family to the head
            // element using media queries in mcvariables.less
            return window.getComputedStyle(document.querySelector('body'), ':after').getPropertyValue('font-family');
        },

        // Adds loading animation to buttons
        // Pass in a domNode or a nodeList
        // And pass in loadingText if you want something
        // else than "Please wait..."
        // Pass in loadingClass to customize whatever class we toggle
        toggleButtonLoadingState: function(buttonNode, loadingText, loadingClass) {
            // Set default class and text
            if (!loadingText) loadingText = "Please wait...";
            if (!loadingClass) loadingClass = "button-loading";

            // set a timeout to not break submit buttons by disabling them.
            setTimeout(function() {
                if (buttonNode instanceof Array) {
                    buttonNode.forEach(function(button) {
                        processButton(button, loadingText);
                    });
                } else {
                    processButton(buttonNode, loadingText);
                }
            }, 0);

            var processButton = function(btn, text) {
                if (btn) {
                    // Check to see if button is one of those pesky Dijit buttons
                    if (domClass.contains(btn, 'dijitButtonContents')) {
                        btn = query(btn).parents('.dijitButton')[0];
                    }
                    // Button is already set to loading, revert it
                    if (domClass.contains(btn, loadingClass)) {
                        setTimeout(function() {
                            domClass.remove(btn, loadingClass);
                            domClass.remove(btn, "loading");
                            switch (btn.tagName) {
                                case "BUTTON":
                                case "A":
                                    originalText = domAttr.get(btn, "data-original-text");
                                    btn.innerHTML = originalText;
                                    break;
                                case "INPUT":
                                    originalText = domAttr.get(btn, "data-original-text");
                                    domAttr.set(btn, "value", originalText);
                                    break;
                                case "SPAN":
                                    originalText = domAttr.get(btn, "data-original-text");
                                    var buttonTextNode = query('.dijitButtonText', btn)[0];
                                    buttonTextNode.innerHTML = originalText;
                                    domClass.remove(btn, 'disabled');
                                    break;
                                default:
                                    break;
                            }
                        }, 1000);
                    } else {
                    // Set button to loading state
                        domClass.add(btn, loadingClass);
                        var originalText;
                        switch (btn.tagName) {
                            case "BUTTON":
                            case "A":
                                originalText = btn.innerHTML;
                                btn.innerHTML = loadingText;
                                break;
                            case "INPUT":
                                originalText = domAttr.get(btn, "value");
                                domAttr.set(btn, "value", loadingText);
                                break;
                            case "SPAN":
                                var buttonTextNode;
                                domClass.add(btn, 'disabled');
                                buttonTextNode = query('.dijitButtonText', btn)[0];
                                originalText = buttonTextNode.innerHTML;
                                buttonTextNode.innerHTML = loadingText;
                                break;
                            default:
                                break;
                        }
                        domAttr.set(btn, "data-original-text", originalText);
                    }
                } else {
                    // throw error
                    console.error('No button found to toggle loading state in.');
                }
            };
        },

        /**
         * Cross browser way to get the correct height of a document for iframe Resizing.
         *
         * From http://james.padolsey.com/javascript/get-document-height-cross-browser/
         */
        docHeight: function(doc) {
            return Math.max(
                Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight),
                Math.max(doc.body.offsetHeight, doc.documentElement.offsetHeight),
                Math.max(doc.body.clientHeight, doc.documentElement.clientHeight)
            );
        },

        /**
         * Globally publish to a channel. Handles pushing the same event to iframes that belong to us.
         * If this event is generated inside a children frame, it will attempt to call globalPublish from there.
         *
         * @param channel
         * @param payload
         */
        globalPublish: function(channel, payload) {
            var domain = document.location.protocol + '//' + document.location.host;

            if(window.self !== window.top && window.top.mojo && window.top.mojo.utils) {
                if(window.top.location.href.slice(0, domain.length) == domain) {
                    window.top.mojo.utils.globalPublish(channel, payload);
                }
            } else {
                // Intentionally using old publish call for backward compat.
                dojo.publish(channel, payload);

                query('iframe').forEach(function(frame) {
                    if(frame.src.slice(0, domain.length) == domain) {
                        var frameWin = frame.contentWindow;
                        // Only fire to the iframe if dojo is loaded there.
                        if(frameWin && frameWin.dojo) {
                            frameWin.dojo.publish(channel, payload);
                        }
                    }
                });
            }
        },

        /**
         * Better way to check if a dom is visible rather than to account for all the styles that could cause
         * it to not be visible.
         *
         * @param dom
         * @returns {boolean}
         */
        isVisible: function(dom) {
            return dom.offsetHeight != 0;
        },

        /**
         *  @param string eventName 
         *  @param array eventData
         */
        logEvent: function(eventName, eventData) {
            require(["mojo/logger"], function(logger) {
                logger.pythia.logEvent(eventName, eventData);
            });
        },

        /**
         *  Replace emoji unicode characters with image tags. See: https://github.com/twitter/twemoji
         *  @param domNode The dom node to be parsed for emoji unicode
         */
        parseEmoji: function(node) {
            require(["twemoji/twemoji"], function(twemoji) {
                twemoji.parse(node, { callback: function(hex) { return utils.emojiImgPath(hex); }});
            });
        },

        /**
         *  Build an image tag for an emoji character.
         *  @param hex The emoji hex code
         */
        emojiImgHtml: function(hex) {
            var emojiChar;
            var src = utils.emojiImgPath(hex);
            require(["twemoji/twemoji"], function(twemoji) {
                emojiChar = twemoji.convert.fromCodePoint(hex);
            });
            return '<img class="emoji" draggable="false" alt="' + emojiChar + '" src="' + src + '">'
        },

        /**
         *  The emoji image path
         *  @param hex The emoji hex code
         */
        emojiImgPath: function(hex) {
            return '/images/emoji/36/' + hex + '.png';
        },

        /**
         * Utility that calculates how long it's been since the given timestamp.
         *
         * @param timestamp
         * @returns {{seconds: number, minutes: number, hours: number, days: number}}
         */
        getTimePassed: function(timestamp) {
            var diff = new Date() - new Date(timestamp);
            var seconds = diff / 1000;
            var minutes = 0;
            var hours = 0;
            var days = 0;

            if(seconds >= 60) {
                minutes = Math.floor(seconds / 60);
                seconds = seconds % 60;

                if (minutes >= 60) {
                    hours = Math.floor(minutes / 60);
                    minutes = minutes % 60;

                    if (hours >= 24) {
                        days = Math.floor(hours / 24);
                        hours = hours % 24;
                    }
                }
            }

            return {
                "seconds": seconds,
                "minutes": minutes,
                "hours": hours,
                "days": days
            }
        },

        isUniqueArray: function (arrayname) {
            return arrayname.every(function (item, pos, self) {
                return self.indexOf(item) == pos || self.indexOf(item) < 0;
            });
        }

    };
    return utils;
});
