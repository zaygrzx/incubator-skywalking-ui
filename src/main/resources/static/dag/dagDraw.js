/**
 * @author pengys5
 */
define(["jquery", "vis", "text!dagHtml", "moment", "nodeCanvas", "alarm", "timers"], function ($, vis, dagHtml, moment, nodeCanvas, alarm) {
    var _containerDiv = "traceDagDiv";
    var _network = null;
    var _data = {
        nodes: new vis.DataSet(),
        edges: new vis.DataSet()
    };

    var _images = {};
    var _options = {
        nodes: {
            borderWidth: 1,
            color: {
                background: '#ffffff'
            },
            shapeProperties: {
                useImageSize: true
            }
        },
        edges: {
            color: '#dd7e6b',
            arrows: {
                to: {enabled: true, scaleFactor: 0.5, type: 'arrow'}
            },
            smooth: false
        },
        layout: {
            improvedLayout: true,
            hierarchical: {
                enabled: true,
                levelSeparation: 200,
                nodeSpacing: 150,
                parentCentralization: false,
                direction: "LR",
                sortMethod: 'directed'
            }
        }
    };

    function _clear() {
        _images = {};
        _data.nodes.clear();
        _data.edges.clear();
    }

    function startNetwork(divId) {
        $("#" + divId).html(dagHtml);
        var container = document.getElementById(_containerDiv);
        _network = new vis.Network(container, _data, _options);
        _resize();
    }

    function _resize() {
        var width = $(document.body).width();
        var height = $(document).height();
        $("#" + _containerDiv).width(width - 360).height(height - 100);
    }

    function _addEdge(nodeRef) {
        console.log(nodeRef.from + " - " + nodeRef.to + " : " + nodeRef.resSum);
        _data.edges.add({from: nodeRef.from, to: nodeRef.to, label: nodeRef.resSum});
    }

    function _addNode(node) {
        console.log(node.id + " - " + node.label + " - " + node.instNum);
        _data.nodes.add({
            id: node.id,
            label: node.label,
            image: nodeCanvas.createNode(node.imageObj, node.instNum),
            shape: 'image'
        })
    }

    function startAutoUpdate() {
        $('body').everyTime('5s', function () {
            load30DayDag();
        })
    }

    function stopAutoUpdate() {
        $('body').stopTime();
    }

    function load30DayDag() {
        var endTimeStr = moment().format("YYYYMMDD") + "0000";
        var startTimeStr = moment().subtract(30, 'days').format("YYYYMMDD") + "0000";

        loadDateRangeDag("day", startTimeStr, endTimeStr);
        // alarm.loadCostData("day", startTimeStr, endTimeStr);
    }

    function loadDateRangeDag(slice, startTimeStr, endTimeStr) {
        console.log("slice: " + slice + ", startTimeStr: " + startTimeStr + ", endTimeStr:" + endTimeStr);
        $.getJSON("dagNodesLoad?timeSliceType=" + slice + "&startTime=" + startTimeStr + "&endTime=" + endTimeStr, function (data) {
            _clear();
            _preLoadImages(data);
            _resize();
        });
    }

    function _preLoadImages(data) {
        for (var i = 0; i < data.nodes.length; i++) {
            var nodeImage = new Image();
            nodeImage.src = data.nodes[i].image;
            nodeImage.id = i;

            nodeImage.onload = function () {
                _images[this.id] = this;

                if (_isFinish(data.nodes.length)) {
                    _pushDagData(data);
                    _network.stabilize();
                }
            }
        }
    }

    function _isFinish(nodeLength) {
        var isFinish = true;
        for (var i = 0; i < nodeLength; i++) {
            if (_images[i]) {
                isFinish = isFinish && true;
            } else {
                isFinish = isFinish && false;
            }
        }
        return isFinish;
    }

    function _pushDagData(data) {
        for (var i in data.nodes) {
            data.nodes[i].imageObj = _images[i];
            _addNode(data.nodes[i]);
        }

        for (var i in data.nodeRefs) {
            _addEdge(data.nodeRefs[i]);
        }
    }

    return {
        resize: _resize,
        startNetwork: startNetwork,
        load30DayDag: load30DayDag,
        loadDateRangeDag: loadDateRangeDag,
        startAutoUpdate: startAutoUpdate,
        stopAutoUpdate: stopAutoUpdate
    }
});

window.onresize = function () {
    require(["dagDraw"], function (dagDraw) {
        dagDraw.resize();
    });
}