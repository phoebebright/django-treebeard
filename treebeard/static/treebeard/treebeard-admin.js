(function($){
// Ok, let's do eeet

// This is the basic Node class, which handles UI tree operations for each 'row'
var Node = function(elem) {
    var $elem = $(elem);
    var node_id = $elem.attr('node');
    var parent_id = $elem.attr('parent');
    var level = $elem.attr('level')
    return {
        elem: elem,
        $elem: $elem,
        node_id: node_id,
        parent_id: parent_id,
        level: level,
        node_name: function() {
            // Returns the text of the node
            return $elem.find('th a:not(.collapse)').text();
        },
        is_collapsed: function() {
            return $elem.find('a.collapse').hasClass('collapsed');
        },
        children: function() {
            return $('tr[parent=' + node_id + ']');
        },
        collapse: function() {
            // For each children, hide it's childrens and so on...
            $.each(this.children(), function(){
                var node = new Node(this);
                node.collapse();
            }).hide();
            // Swicth class to set the proprt expand/collapse icon
            $elem.find('a.collapse').removeClass('expanded').addClass('collapsed');
        },
        parent_node: function() {
            // Returns a Node object of the parent
            return new Node($('tr[node=' + parent_id + ']', $elem.parent())[0]);
        },
        expand: function() {
            // Display each kid (will display in collapsed state)
            this.children().show();
            // Swicth class to set the proprt expand/collapse icon
            $elem.find('a.collapse').removeClass('collapsed').addClass('expanded');

        },
        toggle: function() {
            if (this.is_collapsed()) {
                this.expand();
            } else {
                this.collapse();
            } 
        },
        clone: function() {
            return $elem.clone();
        }
    }
}

$(document).ready(function(){

    // Don't activate drag or collapse if GET filters are set on the page
    if ($('#has-filters').val() === "1") {
        return;
    }

    $body = $('body');

    // Activate all rows and instantiate a Node for each row
    $('td.drag-handler span').addClass('active').bind('mousedown', function(evt) {
        $ghost = $('<div id="ghost"></div>');
        $drag_line = $('<div id="drag_line">line<div></div></div>');
        $ghost.appendTo($body);
        $drag_line.appendTo($body);
        var node = new Node($(this).closest('tr')[0]);
        cloned_node = node.clone();
        $targetRow = null;
        $body.disableSelection().bind('mousemove', function(evt2) {
            $ghost.html(cloned_node).css({  // from FeinCMS :P
                'opacity': .8, 
                'position': 'absolute', 
                'top': evt2.pageY, 
                'left': evt2.pageX-30, 
                'width': 600 
            });
            // oh gawd...
            // Iterate through all rows and see where am I moving so I can place
            // the drag lin accordingly
            rowHeight = node.$elem.height();
            $('tr', node.$elem.parent()).each(function(index, element) {
                $row = $(element); 
                rtop = $row.offset().top;
                // Check if mouse is over this row
                if (evt2.pageY >= rtop && evt2.pageY <= rtop + rowHeight) {
                    $targetRow = $row;
                    // lets estimate the left pad of the node
                    left_pad = parseInt($targetRow.attr('level')*15) + 50;
                    $drag_line.css({
                        'left': node.$elem.offset().left + left_pad,
                        'width': node.$elem.width() - left_pad,
                        'top': rtop,
                    });
                } else {
                    //$targetRow = null;
                }
            });
        }).bind('mouseup', function() {
            if ($targetRow !== null) {
                target_node = new Node($targetRow[0]);
                if (target_node.parent_id !== node.parent_id) {
                    /*alert('Insert node ' + node.node_name() + ' as child of: '
                    + target_node.parent_node().node_name() + '\n and sibling of: '
                        + target_node.node_name());*/
                    // Call $.ajax so we can handle the error
                    $.ajax({
                        url: window.MOVE_NODE_ENDPOINT,
                        type: 'POST',
                        data: {
                            node_id: node.node_id,
                            parent_id: target_node.parent_id,
                            sibling_id: target_node.node_id
                        },
                        complete: function(req, status) {
                            window.location.reload(); 
                        },
                        error: function(req, status, error) {
                            window.location.reload(); 
                        }
                    });
                }
            }
            $ghost.remove();
            $drag_line.remove();
            $body.enableSelection().unbind('mousemove').unbind('mouseup');
        });
    });

    $('a.collapse').click(function(){
        var node = new Node($(this).closest('tr')[0]); // send the DOM node, not jQ
        node.toggle();
        return false;
    });
});
})(django.jQuery);
