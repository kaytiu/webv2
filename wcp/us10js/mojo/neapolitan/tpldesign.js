/**
 * Module that attaches many functions to the window so that they are available globally for neapolitan editor.
 * Ideally they should be modular and we won't have to pollute the window namespace, but we need it to support
 * legacy code.
 */
define("mojo/neapolitan/tpldesign", [
    "dojo/query",
    "dojo/dom",
    "dojo/on",
    "dojo/ready",
    "dojo/touch",
    "dojo/has",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/fx",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/_base/window",
    "dojo/window",
    "dojo/Deferred",
    "dijit/registry",
    "mojo/utils",
    "mojo/url",
    "mojo/neapolitan/dnd/BlockSource",
    "mojo/neapolitan/dnd/ContainerDropTarget",
    "dojo/_base/sniff"
], function(query, dom, on, ready, touch, has, domAttr, domStyle, domClass, domConstruct, domGeom, fx, array, lang, win, viewport, Deferred,
            dRegistry, utils, mUrl, BlockSource, ContainerDropTarget) {
    
    if(typeof(window.disable_editing) == 'undefined') window.disable_editing = false;

    window.refreshCampaign = function() {
        window.location.reload();
    };

    window.createDropTarget = function(t) {
        ContainerDropTarget.create(t);
    };

    /**
     * Return all anchor elements from the preview iframe
     */
    window.getAllAnchors = function() {
        var iframeDoc = dom.byId('preview-template').contentWindow.document;
        return win.withDoc(iframeDoc, function() {
            return query('a[name]').attr('name');
        }, this);
    };

    window.reloadPreview = function() {
        try {
            var preview_doc = dom.byId('preview-template');
            if(preview_doc && preview_doc.contentWindow && preview_doc.contentWindow.document) preview_doc.contentWindow.document.location.reload(true);
        } catch(e) {
            console.log('normal preview - '+e);
        }
    };

    window.resizePreview = function() {
        var frame = dom.byId('preview-template');
        if (domAttr.get(frame,'class')=='preview-template-design') return;
        var height;
        if (dom.byId('template-previewtheme-campaign')){
            height = (domStyle.get('template-previewtheme-campaign', 'height')+75)+'px';
        } else if (dom.byId('template-previewtheme-template')){
            height = (domStyle.get('template-previewtheme-template', 'height')+75)+'px';
        } else {
            var previewDoc = frame.contentWindow.document;
            var bodyHeight = domGeom.position(previewDoc.body).h;
            // Can't make the assumption that body height is the true height due to custom templates.
            height = utils.docHeight(previewDoc) + "px";
        }
        frame.style.height = height;
        query('.iframe-dnd-overlay').style('height', height);
    };

    window.loadPreview = function(resetParent) {
        if (typeof(resetParent) == 'undefined') resetParent = true;
        ready(function() {
            if(window.Preview) {
                window.Preview.loadPreview(resetParent, {
                    'defaultBlocks': window.defaultBlocks,
                    'refreshBlocks': window.refreshBlocks,
                    'layoutChanged': window.layoutChanged
                }).then(function() {
                    // Loading animation for design frame
                    ready(function() {
                        var loadMessage = query('.iframe-loading-message.design')[0];
                        domStyle.set(loadMessage, 'display', 'none');
                        domClass.remove(loadMessage.parentNode,'loading');
                    });
                });
            }

            window.defaultBlocks = null;

            resetFrameMinHeight();
            var repositionTimer = {};
            on(window, 'resize', function() {
                clearTimeout(repositionTimer);
                repositionTimer = setTimeout(function() {
                    resetFrameMinHeight();
                }, 350);
            });
        });
    };

    window.saveFromUrl = function(url) {
        var deferred = new Deferred();

        dojo.xhrPost({
            'url':save_image_from_url,
            'content':{ 'img': url },
            'handleAs':'json',
            'load': function (response) {
                if (response.status == 'success') {
                    deferred.resolve(mUrl.addProxy(response.url));
                } else {
                    dojo.publish('show-toast', [{
                        'message':'Drats, unable to save image from that URL!',
                        'type':'warning'
                    }]);
                    deferred.reject();
                }
            }
        });

        return deferred;
    };

    window.setContentFromBlock = function(blockName, section) {
        dojo.xhrPost({
            'url': set_content_from_block_url,
            'content': {'section':section,'block':blockName},
            'handleAs': 'json',
            'load': function(data) {
                reloadPreview();
            }
        });
    };

    window.confirmDelete = function(successCallback) {
        var confirmation = new dijit.Dialog({
            'title': 'Are you sure?',
            'content': '<div class="dijitDialogPaneContentArea"><p>You&rsquo;re about to delete a content block. Are you sure you want to do that?</p><p class="small-meta nomargin">Hint: Hold the &ldquo;alt&rdquo; key while clicking the delete button to skip this dialog.</p><div class="dijitDialogPaneActionBar"><div class="buttonsContainer"></div></div></div>'
        });

        var buttonContainer = query('.buttonsContainer', confirmation.domNode)[0];
        var okButton = domConstruct.place("<a href='#' class='button p0'>Delete</a>", buttonContainer);
        var cancelButton = domConstruct.place("<a href='#'>Cancel</a>", buttonContainer);

        query(okButton).on('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            successCallback();
            confirmation.hide();
        });

        query(cancelButton).on('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            confirmation.hide();
            return false;
        });

        confirmation.show();
    };

    window.hotKeyHandler = function(e) {
        var checkForInputs = function(e) {
            return (e.target && ((e.target.tagName.toUpperCase() == 'INPUT' || e.target.tagName.toUpperCase() == 'TEXTAREA')));
        };
        var checkForInputsInIE = function(e) {
            if (typeof e.srcElement == 'undefined') {
                return false;
            } else {
                return (e.srcElement && ((e.srcElement.tagName.toUpperCase() == 'INPUT') || (e.srcElement.tagName.toUpperCase() == 'TEXTAREA')));
            }
        };
        var checkForCK = function(e) {
            return (typeof e.sender != 'undefined');
        };
        // Browser tab switching in Windows uses CTRL + #, so let's not do anything when ctrl is held down
        if (e.ctrlKey || e.metaKey) {
            return false;
        } else {
            // e.data.keyCode is for events coming from CK that get changed a bit
            var keyCode = e.data ? e.data.keyCode : e.keyCode;
            // Let's handle escape first, otherwise only handle keys if alt is being pressed
            if (keyCode === 27) {
                utils.globalPublish('mojo/editor/escapePressed', e);
            } else {
                // Make sure we're not inside of something that types text
                if (checkForInputs(e) ==  false && checkForInputsInIE(e) == false && checkForCK(e) == false) {
                    switch(keyCode) {
                        case 49:
                            utils.globalPublish('mojo/editor/togglePreview');
                            break;
                        case 50:
                            utils.globalPublish('mojo/editor/toggleTestPopup');
                            break;
                        case 51:
                            utils.globalPublish('mojo/editor/togglePushToMobilePopup');
                            break;
                        case 52:
                            utils.globalPublish('mojo/editor/toggleLinkChecker');
                            break;
                        case 53:
                            utils.globalPublish('mojo/editor/toggleShareSettings');
                            break;
                        case 72:
                            utils.globalPublish('mojo/editor/toggleHotkeyHelp');
                            break;
                    }
                }
            }
        }
    };

    window.toggleTabletMobilePreview = function() {
        var mobilePreview = dom.byId('mobile-preview');
        var mobileToggle = dom.byId('mobile-toggle');
        if(domClass.contains(mobilePreview, "show")){
            domClass.remove(mobilePreview, "show");
            dojo.html.set(mobileToggle, "Show Mobile");
        } else {
            domClass.add(mobilePreview, "show");
            dojo.html.set(mobileToggle, "Show Desktop");
        }
    };

    window.toggleHotkeyHelpPane = function() {
        var hotkeyPane = dom.byId('hotkey-help-pane');
        if (domStyle.get(hotkeyPane, 'display') == 'block') {
            domStyle.set(hotkeyPane, 'display', 'none');
        } else {
            if(has("mac")){
                // Let's change the keyboard shortcuts to the command symbol
                var placeholders = query('span.os-key', hotkeyPane);
                array.forEach(placeholders, function(placeholder) {
                    dojo.html.set(placeholder, '&#8984;');
                });
                domStyle.set(hotkeyPane, 'display', 'block');
            }
        }
    };

    /**
     * Private helper functions that aren't meant to be available to the window
     */

    function resetFrameMinHeight() {
        var frame = dom.byId('preview-template');
        var previewHeight = dojo.coords(dom.byId('previewcol')).h + 'px';
        domStyle.set(frame, "minHeight", previewHeight);
    }

    /**
     * Any setup JS that needs to happen in all places that neapolitan is present should happen here to avoid
     * duplicating code. (ie. campaign and template editor)
     */
    ready(function() {

        // Prevent browser from navigating to a file URL when user does not drop file
        // into an image placeholder
        if (window.File || window.FileList || window.FileReader) {
            dojo.connect(window.document, "dragover", function(e) {
                e.stopPropagation();
                dojo.stopEvent(e);
            });

            dojo.connect(window.document, "drop", function(e) {
                e.stopPropagation();
                dojo.stopEvent(e);
            });
        }

        // Escape to save/hide editor
        dojo.connect(window.document, 'keyup', lang.hitch(this, window.hotKeyHandler));

        // Handle keyboard shortcuts
        dojo.subscribe("mojo/editor/escapePressed", function(e) {
            query('.templateImagePreview').style('display', 'none');

            // Quick check to see if there's visible sliders. and ignore esc events.
            var paneVisible = query('.topsliderpane-container').some(function(pane) { return domStyle.get(pane, 'display') != 'none'; });
            if(paneVisible) return;

            // Check if an aviary modal is open
            if (dom.byId('avpw_fullscreen_bg') && domStyle.get(dom.byId('avpw_fullscreen_bg'), 'display') == 'block') {
                // Check if an aviary modal is open
                window.featherEditor.close();
                // First check if there is a preview pane open, and close only that
            } else if (dom.byId('push-mobile-dialog') && dRegistry.byId('push-mobile-dialog').open === true || dom.byId('send-test-modal') && dRegistry.byId('send-test-modal').open === true) {
                // do nothing, since these modals handle being closed by the escape key
                return false;
            } else if (app.linkChecker && app.linkChecker.displayActive) {
                app.linkChecker.hide();
            } else if (app.previewPane && app.previewPane.displayActive) {
                utils.globalPublish('mojo/editor/togglePreview');
            } else if (query('.dojoxColorPicker')[0] && domStyle.get(query('.dojoxColorPicker')[0], 'display') == 'block') {
                var colorPickerId = domAttr.get(query('.dojoxColorPicker')[0], 'widgetid');
                var colorPicker = dRegistry.byId(colorPickerId);
                colorPicker.hide();
            } else if (dom.byId('editor-pane') && domStyle.get(dRegistry.byId('editor-pane').domNode, 'display') == 'block') {
                // Otherwise, if there is no modal visible and an editor open, close that instead
                // Don't hide the editor if there is a modal visible
                var dijitUnderlay = query('.dijitDialogUnderlayWrapper');
                if (!(dijitUnderlay.length && dijitUnderlay.style('display')[0] == 'block')) {
                    dRegistry.byId('editor-pane').closeEditor();
                }
            }

            // Let's not focus the window when event is coming from CK
            if (!e.sender || has("ie")) {
                var focusHack = dom.byId('focusHack');
                if (focusHack) {
                    focusHack.focus();
                }
            }
        });

        // If we're not on the getting started step.
        if (dom.byId('preview-template')) {
            var modal_ids = ['edit-content-modal','edit-imagetext-modal'];
            var scrolling_ids = ['themes', 'theme-categories'];
            array.forEach(modal_ids, function(modal_id) {
                dojo.connect(dRegistry.byId(modal_id), 'show', function() {
                    array.forEach(scrolling_ids, function(scroll_id) {
                        if (dom.byId('scroll_id')) domStyle.set(scroll_id, 'overflow', 'hidden');
                    });
                });

                dojo.connect(dRegistry.byId(modal_id), 'hide', function() {
                    array.forEach(scrolling_ids, function(scroll_id) {
                        if (dom.byId('scroll_id')) domStyle.set(scroll_id, 'overflow', '');
                    });
                });
            });

            var blocksContainer = dom.byId('blocks-container');
            if(blocksContainer) {
                var blocksSource = new BlockSource(blocksContainer, {campaignType: window.campaign_type});
            }

            dojo.subscribe("mojo/editor/togglePreview", function(e) {
                app.togglePreview();
            });

            dojo.subscribe("mojo/editor/toggleTestPopup", function(e) {
                // Reset the send test form
                dojo.setStyle(dom.byId('send-test-success'), 'display', 'none');
                if (dom.byId('send-test-samedomain')) dojo.setStyle(dom.byId('send-test-samedomain'), 'display', 'none');
                dojo.setStyle(dom.byId('send-test-form'), 'display','block');

                if(dRegistry.byId('push-mobile-dialog')) dRegistry.byId('push-mobile-dialog').hide();


                var modal = dRegistry.byId('send-test-modal');
                if (modal.open === true) {
                    modal.hide();
                } else {
                    modal.show();
                    dom.byId('test-email').focus();
                }
            });
            dojo.subscribe("mojo/editor/togglePushToMobilePopup", function(e) {
                dRegistry.byId('send-test-modal').hide();
                var modal = dRegistry.byId('push-mobile-dialog');
                if(modal) {
                    if (modal.open === true) {
                        modal.hide();
                    } else {
                        modal.show();
                    }
                }
            });

            dojo.subscribe("mojo/editor/toggleLinkChecker", function(e) {
                if(tpl_type === 'campaign') {
                    if(app.linkChecker){
                        if(dojo.hasClass(dojo.query('body')[0], 'slider-editor')){
                            app.linkChecker.hide();
                        } else {
                            app.linkChecker.show();
                        }
                    } else {
                        app.showLinkChecker();
                    }
                }
            });

            dojo.subscribe("mojo/editor/toggleShareSettings", function(e) {
                if (app.shareSettings) {
                    if (app.shareSettings.displayActive) {
                        app.shareSettings.hide();
                    } else {
                        app.shareSettings.show();
                    }
                } else {
                    app.showShareSettings();
                }
            });

            dojo.subscribe("mojo/editor/toggleHotkeyHelp", function(e) {
                window.toggleHotkeyHelpPane();
            });
        }

        // This is to get around the fact that you can't scroll iframes in IOS
        if(has("ios")) {
            query(".iframe-wrapper").addClass('ios-iframe-scroll');
        }

        // Focus hack
        dom.byId('focusHack').focus();

    });

    return {};
});
