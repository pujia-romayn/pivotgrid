
var PivotGrid = function (config) {
    $.extend(this, config);
    this.init();
}

PivotGrid.prototype = {

    grandTotal: false,
    defaultGrandTotal: false,

    init: function () {
        var me = this,
        //html = '<div class="pivot-filterfields"></div><div class="pivot-datafields"></div><div class="pivot-rowfields"></div><div class="pivot-columnfields"></div>';
        //html = '<div class="pivot-left"></div><div class="pivot-content"></div>';
            html = '';

        me.el = document.createElement('div');
        me.el.className = 'pivot';

        me.el.innerHTML = html;

        me.createTable();

        me.doLayout();
    },

    doLayout: function () {

        var leftEl = $('.pivot-left', this.el);
        var contentEl = $('.pivot-content', this.el);

        var height = $('.pivot-columns', this.el).height();

        leftEl.css('padding-top', height);

        contentEl.css('left', leftEl.children('.pivot-table').width());
    },

    createTable: function () {
        var me = this,
            el = me.el,
            sb = [],
            columnFields = me.columnFields,
            rowFields = me.rowFields,
            dataFields = me.dataFields,
            data = me.data,
            options = { grandTotal: me.grandTotal, defaultGrandTotal: me.defaultGrandTotal },
            resultData = createPivotData(data, columnFields, rowFields, dataFields, options),
            columnData = resultData.columnData,
            rowData = resultData.rowData,
            cellData = resultData.cellData;

        //sb[sb.length] = '<table class="pivot-table">';

        var columnsTable = ColumnUtil.createTable(columnData, 'items');
        var rowsTable = ColumnUtil.createVTable(rowData, 'items');


        sb[sb.length] = '<div class="pivot-left">';
        me.createRowHeader(sb, rowsTable);
        sb[sb.length] = '</div>';

        sb[sb.length] = '<div class="pivot-content">';
        me.createColumnHeader(sb, columnsTable);
        me.createCell(sb, cellData);
        sb[sb.length] = '</div>';

        //sb[sb.length] = '</table>';

        el.innerHTML = sb.join('');
    },

    createColumnHeader: function (sb, table) {
        var me = this;

        sb[sb.length] = '<table class="pivot-table pivot-columns" cellspacing="0" cellpadding="0" border="0">';

        for (var i = 0, l = table.length; i < l; i++) {
            var row = table[i];
            sb[sb.length] = '<tr>';

            for (var j = 0, k = row.length; j < k; j++) {
                var cell = row[j];

                sb[sb.length] = '<td class="pivot-headercell pivot-columncell" style="';

//                if (!cell.items) {
//                    sb[sb.length] = 'width:100px;';
//                }

                sb[sb.length] = '" ';
                if (cell.colspan > 1) {
                    sb[sb.length] = 'colspan="';
                    sb[sb.length] = cell.colspan;
                    sb[sb.length] = '"';
                }
                if (cell.rowspan > 1) {
                    sb[sb.length] = 'rowspan="';
                    sb[sb.length] = cell.rowspan;
                    sb[sb.length] = '"';
                }
                sb[sb.length] = '>';
                sb[sb.length] = cell.value;
                sb[sb.length] = '</td>';
            }

            sb[sb.length] = '</tr>';
        }

        sb[sb.length] = '</table>';
    },

    createRowHeader: function (sb, table) {
        var me = this;

        sb[sb.length] = '<table class="pivot-table" cellspacing="0" cellpadding="0" border="0">';

        for (var i = 0, l = table.length; i < l; i++) {
            var row = table[i];
            sb[sb.length] = '<tr>';

            for (var j = 0, k = row.length; j < k; j++) {
                var cell = row[j];

                sb[sb.length] = '<td class="pivot-headercell pivot-rowcell" ';
                if (cell.colspan > 1) {
                    sb[sb.length] = 'rowspan="';
                    sb[sb.length] = cell.colspan;
                    sb[sb.length] = '"';
                }
                if (cell.rowspan > 1) {
                    sb[sb.length] = 'colspan="';
                    sb[sb.length] = cell.rowspan;
                    sb[sb.length] = '"';
                }
                sb[sb.length] = '>';
                sb[sb.length] = cell.value;
                sb[sb.length] = '</td>';
            }

            sb[sb.length] = '</tr>';
        }

        sb[sb.length] = '</table>';
    },

    createCell: function (sb, data) {

        sb[sb.length] = '<table class="pivot-table" cellspacing="0" cellpadding="0" border="0">';

        for (var i = 0, l = data.length; i < l; i++) {
            var record = data[i];

            sb[sb.length] = '<tr>';

            for (var j = 0, k = record.length; j < k; j++) {
                var cell = record[j];

                sb[sb.length] = '<td class="pivot-cell">';
                sb[sb.length] = cell.value;
                sb[sb.length] = '</td>';
            }

            sb[sb.length] = '</tr>';
        }

        sb[sb.length] = '</table>';
    },

    render: function (parent) {
        $(parent).append(this.el);
        this.doLayout();
    }
};


//==============================================================================================================

function createGroupData(data, groupFields, dataFields) {
    //var group = createGroupByFields(data, groupFields);

    var group = GroupUtil.groupFields(data, groupFields);   //优化：改造groupFields方法直接实现一下2个步骤？
    //getGroupTree? getGroupTreeWithData?

    //1)转换：最底层一级转换为data，而非items。
    function each(nodes) {
        for (var i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];            
            var firstItem = node.items[0];
            if (!firstItem._group) {
                node.data = node.items;
                delete node.items;
            } else {
                each(node.items);
            }
        }
    }
    each(group);

    //2)给每一个node设置data属性
    function eachForData(nodes) {
        var allData = [];
        for (var i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];

            if (node.items) {
                node.data = eachForData(node.items);
            }
            allData = allData.concat(node.data)
            
        }
        return allData;
    }
    
    eachForData(group);
    
    //3)生成grandTotal
    function eachForTotal(nodes) {
        var list = [];
        for (var i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];

            list.push(node);

            if (node.items) {
                
                //if (node.items.length > 1) {      //加上的化，表示如果只有一个子节点，就不生成小计列。
                    var total = { value: node.value + ' Total', field: '', name: '', level: node.level, _group: true, total: true };
                    total.data = node.data;
                    list.push(total);
                //}

                node.items = eachForTotal(node.items);
            }

        }
        return list;
    }

    group = eachForTotal(group);

    //4) grandTotal
    var grandTotal = { value: 'Grand Total', field: '', name: '', total: true };
    grandTotal.data = [];
    for (var i = 0, l = group.length; i < l; i++) {
        var node = group[i];
        if (node.total) {
        } else {
            grandTotal.data = grandTotal.data.concat(node.data);
        }
    }
    group.push(grandTotal);

    //5) 多dataFields会生成多个
    if (dataFields && dataFields.length) {
        if (dataFields.length == 1) {
            var dataField = dataFields[0];
            TreeUtil.each(group, function (node, parent, index, level) {

                if (!node.items) {
                    node.dataField = dataField;
                }

            }, 'items');
        } else {

            function createDataFieldsItems(node) {
                var items = [];
                for (var i = 0, l = dataFields.length; i < l; i++) {
                    var dataField = dataFields[i];
                    var item = { value: dataField.field, data: node.data };
                    item.dataField = dataField;
                    items.push(item);
                }
                return items;
            }

            function eachForDataFields(nodes) {
                for (var i = 0, l = nodes.length; i < l; i++) {
                    var node = nodes[i];
                    if (!node.items) node.items = createDataFieldsItems(node);
                    else eachForDataFields(node.items);
                }
            }
            
            eachForDataFields(group);
        }
        
    }

    return group;
}

//function initFields(fields) {
//    
//}

var Record_ID = 1;
function initData(data){
     for (var i = 0, l = data.length; i < l; i++) {
        var o = data[i];
        o._id = Record_ID++;
     }
}

function getBottomData(groupData) {
    var bottom = [];

    function each(nodes) {
        for (var i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];
//            var firstItem = node.items[0];
//            if (firstItem._group) {
//                each(node.items);
//            } else {
//                bottom.push(node);
            //            }
            if (node.items) {
                each(node.items);
            } else {
                bottom.push(node);
            }            
        }
    }

    each(groupData);

    return bottom;
}

function createSummaryValue(data, field, summaryType) {
    var value;
    if (summaryType == "sum") {
        value = 0;
        for (var i = 0, l = data.length; i < l; i++) {
            var o = data[i];
            var num = parseFloat( o[field]);
            if (!isNaN(num)) {
                //value += num;
                value = NumberUtil.add(value, num);
            }
        }
    }
    return value;
}

function createCellData(columns, rows, dataFields) {
    var data = [];


    //实现多级dataFields交叉



    function getCrossData(data1, data2){
        var map = {};
        for (var i = 0, l = data1.length; i < l; i++) {
            var o = data1[i];
            map[o._id] = o;
        }
        var data = [];
        for (var i = 0, l = data2.length; i < l; i++) {
            var o = data2[i];
            if(map[o._id]) data.push(o);
        }
        return data;
    }
    
    for (var i = 0, l = rows.length; i < l; i++) {
        var row = rows[i];
        var record = [];
        data.push(record);

        for (var j = 0, k = columns.length; j < k; j++) {
            var column = columns[j];
            var crossData = getCrossData(row.data, column.data);

            var dataField = column.dataField || row.dataField;
            var summaryType = dataField.summaryType;
            var summaryField = dataField.field;

            var cell = {
                data: crossData,
                row: row,
                column: column,
                //dataField: dataField,     //dataField是否应该从column上来？
                summaryType: summaryType,
                value: createSummaryValue(crossData, summaryField, summaryType)
            };
            record.push(cell);
        }

    }
    
    return data;
}

function createPivotData(data, columnFields, rowFields, dataFields, options) {
//    initFields(columnFields);
//    initFields(rowFields);
    //    initFields(dataFields);

    options = $.extend({
        grandTotal: true,
        defaultGrandTotal: true
    }, options);

    initData(data);

    //1）根据数组和分组字段，以及数据字段，生成分组对象（树形结构）
    var columnData = createGroupData(data, columnFields, dataFields, options);
    var rowData = createGroupData(data, rowFields, null, options);


    //2）得到行列的底层，然后交叉计算
    var columns = getBottomData(columnData);
    var rows = getBottomData(rowData);
    var cellData = createCellData(columns, rows, dataFields);
    
    return {
        columnData: columnData,
        rowData: rowData,
        cellData: cellData
    };
}

//==============================================================================================================
var groupId = 1,
    groupFormat = function (v) {
        return v && v.getFullYear ? v.getTime() : String(v);
    };

    var GroupUtil = {
        
        groupFields: function (data, fields) {
            fields = fields || [];
            // fields: [{ field: 'age'}, ...]
            function doGroup(data, index) {
                // group = { field: 'age', dir: 'desc', value: 20, text: '20', group: true, items: [] }
                var o = fields[index];
                if (!o) return [];
                var groups = GroupUtil.groupField(data, o.field, index);
                if (fields[index + 1]) {
                    for (var i = 0, l = groups.length; i < l; i++) {
                        var group = groups[i];
                        group.items = doGroup(group.items, index + 1);
                    }
                }
                return groups;
            }
            return doGroup(data, 0);
        },

        groupField: function (data, field, level) {
            var 
                level = level || 0,
                groups = [],
                maps = {},
                group, i, l, item, value, name;

            for (i = 0, l = data.length; i < l; i++) {
                item = data[i];
                //value = getMappingValue(item, field);
                value = item[field];
                name = groupFormat(value);
                group = maps[name];

                if (!group) {

                    group = { value: value, items: [], field: field, name: name, level: level, _group: true };

                    group._id = 'group' + groupId;

                    //group.footer = { _groupfooter: true, _id: 'groupfooter' + mini.group_id };

                    groups.push(group);
                    maps[name] = group;

                    groupId++;
                }
                group.items.push(item);
                //item._gpid = group._id;
            }
            return groups;
        }


    };

    var TreeUtil = {

        tree2list: function (nodes, nodesField, idField, pidField, parentId) {
            //var array = tree2list(tree, 'children', 'id', 'pid', -1);
            if (!nodes) return;
            if (!mini.isArray(nodes)) nodes = [nodes];
            if (!nodesField) nodesField = 'children';
            var array = [];
            for (var i = 0, l = nodes.length; i < l; i++) {
                var node = nodes[i];
                array[array.length] = node;

                if (pidField) node[pidField] = parentId;

                //var childNodes = getMappingValue(node, nodesField);
                var childNodes = node[nodesField];
                if (childNodes && childNodes.length > 0) {
                    var id = node[idField];
                    var childrenArray = TreeUtil.tree2list(childNodes, nodesField, idField, pidField, id);
                    array.addRange(childrenArray);
                }
            }
            return array;
        },

        each: function (nodes, fn, nodesField) {

            //if (!tree || typeof fn != 'function') return;
            //if (!mini.isArray(tree)) tree = [tree];

            var isBreak = false;
            if (!nodesField) nodesField = 'children';
            function each(nodes, parent, level) {
                if (isBreak) return;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    var node = nodes[i];
                    if (fn(node, parent, i, level) === false) {
                        isBreak = true;
                        return;
                    }
                    //var children = getMappingValue(node, nodesField);
                    var children = node[nodesField];
                    if (children && children.length > 0) {
                        each(children, node, level + 1);
                    }
                    if (isBreak) return;
                }
            }

            each(nodes, null, 0);
        }

    };


    var NumberUtil = {

        add: function (num1, num2) {
            var sq1, sq2, m;
            try { sq1 = num1.toString().split(".")[1].length; } catch (e) { sq1 = 0; }
            try { sq2 = num2.toString().split(".")[1].length; } catch (e) { sq2 = 0; }
            m = Math.pow(10, Math.max(sq1, sq2));
            return parseInt((num1 * m + num2 * m).toFixed(0)) / m;
        }

    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////

    var ColumnUtil = {

        getMaxLevel: function (tree, itemsField) {
            itemsField = itemsField || 'children';
            var maxLevel = 0;
            function each(nodes, level) {
                for (var i = 0, l = nodes.length; i < l; i++) {
                    var node = nodes[i];
                    var childNodes = node[itemsField];
                    //node._level = level;
                    if (maxLevel < level) maxLevel = level;
                    if (childNodes) each(childNodes, level + 1);
                }
            }
            each(tree, 0);
            return maxLevel;
        },

        createRowColSpan: function (tree, itemsField) {

            itemsField = itemsField || "children";

            var maxLevel = ColumnUtil.getMaxLevel(tree, itemsField);

            function getColSpan(node) {
                var list = TreeUtil.tree2list(node[itemsField], itemsField);
                var colSpan = 0;
                for (var i = 0, l = list.length; i < l; i++) {
                    var c = list[i];
                    //if (me.isVisibleColumn(c) == false) continue;
                    //if (!c.columns || c.columns.length == 0) {
                    if (!c.columns || c.columns.length == 0) {
                        colSpan += 1;
                    }
                }
                return colSpan;
            }

            function eachNodes(nodes, level) {

                var span = 0;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    var node = nodes[i];

                    var childNodes = node[itemsField];

                    node.colspan = 1;
                    node.rowspan = 1;

                    if (childNodes) {
                        node.colspan = eachNodes(childNodes, level + 1);
                        if (node.colspan == 0) node.colspan = 1;
                    } else {
                        node.rowspan = maxLevel - level + 1;
                    }

                    span += node.colspan;
                }
                return span;
            }

            eachNodes(tree, 0);

        },

        createTable: function (tree, itemsField) {

            itemsField = itemsField || "children";

            ColumnUtil.createRowColSpan(tree, itemsField);

            var table = [];

            function eachNodes(nodes, level) {

                for (var i = 0, l = nodes.length; i < l; i++) {
                    var node = nodes[i];

                    var row = table[level];
                    if (!row) row = table[level] = [];
                    row.push(node);

                    var childNodes = node[itemsField];
                    if (childNodes) {
                        eachNodes(childNodes, level + 1);
                    }
                }
            }

            eachNodes(tree, 0);

            return table;
        },

        createVTable: function (tree, itemsField) {


            itemsField = itemsField || "children";

            ColumnUtil.createRowColSpan(tree, itemsField);

            var table = [];

            var rowIndex = 0;
            function eachNodes(nodes) {

                for (var i = 0, l = nodes.length; i < l; i++) {
                    var node = nodes[i];

                    var row = table[rowIndex];
                    if (!row) row = table[rowIndex] = [];
                    row.push(node);

                    var childNodes = node[itemsField];
                    if (childNodes) {
                        eachNodes(childNodes);
                    }

                    if (i + 1 < l) rowIndex++;
                }
            }

            
            eachNodes(tree);

            return table;
        }

    };

    