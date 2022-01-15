<template>
  <div class="component-table__wrapper" v-show="active" :style="{overflowY: data && data.length ? '' : 'hidden'}">
    <div v-if="loading" class="mask">
      <div class="loading-spinner">
        <svg viewBox="25 25 50 50" class="circular"><circle cx="50" cy="50" r="20" fill="none" class="path"></circle></svg>
        <p class="loading-text">拼命加载中</p>
      </div>
    </div>
    <div style="overflow:hidden;width:100%;height:100%">
      <div class="table-wrapper__div flexbox-vertical">
        <div class="table-head__div flex-none">
          <table style="width: 100%">
            <colgroup>
              <col v-for="(item, index) in dataCols"
                :width="item.width" :key="index">
            </colgroup>
            <thead>
              <tr v-for="(cols, index) in headCols" :key="index">
                <template v-for="(field, idx) in cols">
                  <th :key="idx" v-if="field.type==='index'" :rowspan="headRows" :width="field.width || 50" :class="'table-column__' + idx">#</th>
                  <th :key="idx" v-else-if="field.type==='selection'" :rowspan="headRows" :width="field.width || 50" :class="'table-column__' + idx">
                    <input type="checkbox" @change="toggleAllCheckboxes" class="table-th__checkbox">
                  </th>
                  <th v-else-if="$scopedSlots['th.' + field.name]" :key="idx" :align="field.align || 'center'"
                    :style="{minWidth: field.minWidth + 'px'}" :rowspan="field.rowspan" :colspan="field.colspan"
                    :class="'table-column__' + idx">
                    <slot :name="'th.' + field.name" :row-name="field.name"
                      :row-data="getColData(field)" :row-index="idx"
                    ></slot>
                  </th>
                  <th v-else :key="idx" v-html="renderTitle(field)" style="height: 38px;"
                    :style="{minWidth: field.minWidth + 'px'}" :rowspan="field.rowspan" :colspan="field.colspan"
                    :align="field.align || 'center'" :class="'table-column__' + idx"></th>
                </template>
                <th class="supplement-th" v-if="index === 0" :rowspan="headRows"></th>
              </tr>
            </thead>
          </table>
        </div>
        <div class="empty-data flex-1" v-if="!data || !data.length">暂无数据</div>
        <div :class="['table-body__div', 'flex-1', border?'border':'', strip?'strip':'']" v-else>
          <table style="width: 100%">
            <colgroup>
              <col v-for="(item, index) in dataCols"
                :width="item.width" :key="index">
            </colgroup>
            <tbody>
              <tr v-for="(data, index) in tableData" :key="index" :class="['table-body__tr', data._rowClass]">
                <template v-for="(field, idx) in dataCols">
                  <td :key="idx" v-if="field.type==='index'" align="center" :width="field.width || 50" :class="'table-column__' + idx">{{index + 1}}</td>
                  <td :key="idx" v-else-if="field.type==='selection'" align="center" :width="field.width || 50" :class="'table-column__' + idx">
                    <input type="checkbox" @change="toggleCheckbox(data, index, $event)"
                          :checked="rowSelected(index)">
                  </td>
                  <td v-else-if="!data[field.name+'dis'] && $scopedSlots['td.' + field.name]" :key="idx" :align="field.align || 'center'"
                    :style="{minWidth: field.minWidth + 'px'}" :class="'table-column__' + idx">
                    <slot :name="'td.' + field.name"
                      :row-data="data" :row-index="index"
                    ></slot>
                  </td>
                  <td :key="idx" :rowspan="data[field.name+'span']" v-else v-html="getObjectValue(data, field, index)"
                    style="height: 30px;" :align="field.align || 'center'" :style="{minWidth: field.minWidth + 'px'}" :class="'table-column__' + idx" :title="field.tooltip ? getObjectValue(data, field, index):''">
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-footer__div flex-none" v-if="hasSummary">
          <table style="width: 100%">
            <colgroup>
              <col v-for="(item, index) in dataCols"
                :width="item.width" :key="index">
            </colgroup>
            <tfoot>
              <tr>
                <template v-for="(field, index) in dataCols">
                  <td :key="index" v-if="field.type==='index'" align="center">{{summaryTitle}}</td>
                  <td :key="index" v-if="field.type==='selection'" align="center">{{summaryTitle}}</td>
                  <td :key="index" v-html="getTotal(field, index)" style="height: 38px;"
                    :align="field.align || 'center'"  :style="{minWidth: field.minWidth + 'px'}"></td>
                </template>
                <td class="supplement-td"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TlTable",
  props: {
    options: { type: Object, default: () => {} },
    data: { type: Array, default: () => [] },
    active: Boolean,
    loading: Boolean,
    border: Boolean,
    strip: Boolean
  },
  data() {
    return {
      // tableData: [],  // 表格数据
      selectedTo: [], // 复选框选择序号
      multipleSelection: [], // 复选框选择项
      summaryTitle: "", // 合计行标题
      allWidth: false, // 是否每个列都设置了宽度
      headCols: [],
      dataCols: [],
      headRows: 0,
      tableWidth: 0
    };
  },
  mounted() {
    this.__init__();
    window.addEventListener("resize", this.recaculateTableWidth);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.recaculateTableWidth);
    window.removeEventListener("scroll", this.scrolled);
  },
  watch: {
    active() {
      setTimeout(() => {
        this.recaculateTableWidth();
      }, 100);
      this._tableBody = this.$el.querySelector(".table-body__div");
      this._tableHead = this.$el.querySelector(".table-head__div");
      if (this._tableBody) {
        if (this.active) {
          this._tableBody.addEventListener("scroll", this.scrolled);
        } else {
          this._tableBody.removeEventListener("scroll", this.scrolled);
        }
      }
    },
    data() {
      setTimeout(() => {
        this.recaculateTableWidth();
      }, 100);
    },
    options() {
      setTimeout(() => {
        this.__init__();
      }, 100);
    }
  },
  computed: {
    // 是否有合计行
    hasSummary() {
      return this.options.columns.some(item => {
        return item.summaryTitle || item.summaryMethod || item.summaryText;
      });
    },
    tableData() {
      // 首先获取是否有需要合并列的操作，有的话就进行合并列，没有就直接赋值
      let combineCells = this.getCombineCells();
      if (combineCells.length) {
        return this.combineCell();
      } else {
        return this.data;
      }
    }
  },
  methods: {
    __init__() {
      // 从设置项里获取合计行标题
      this.options.columns.some(item => {
        if (item.summaryTitle) {
          this.summaryTitle = "";
          return true;
        }
        this.summaryTitle = "合计";
      });
      // 判断是否每一列都设置了宽度
      let allWidth = this.options.columns.some(item => {
        return !item.width;
      });
      this.allWidth = !allWidth;
      this.headRows = this.rowCount(this.options.columns);
      let columns = this.options.columns.filter(item => {
        return item.display !== "none";
      });
      this.initColumns(columns);
      this.dataCols = this.getDataCols(columns);
      setTimeout(() => {
        this.recaculateTableWidth();
      }, 100);
    },
    // 获取表头行数
    rowCount(columns) {
      let count = 1;
      count += Math.max.apply(
        null,
        columns.map(col => {
          return col.columns ? this.rowCount(col.columns) : 0;
        })
      );
      return count;
    },
    // 初始化表格
    initColumns(columns) {
      this.headCols = [];
      this.tableWidth = 0;
      let recursion = (columns, key = 0, next) => {
        let tempArr = [];
        next && key++;
        this.headCols.push(columns);
        columns.forEach(item => {
          if (item.columns && item.columns.length) {
            item.colspan = this.getColspan(item.columns);
            item.rowspan = 1;
            tempArr = tempArr.concat(item.columns);
          } else {
            let width = item.width || 120;
            this.tableWidth += width;
            item.rowspan = this.headRows - key;
          }
        });
        if (tempArr && tempArr.length) {
          recursion(tempArr, key, true);
        }
      };
      recursion(columns);
    },
    // 获取所传元素的colspan
    getColspan(column) {
      return this.mapTree(column, [], "columns").length;
    },
    // 获取table body数据列
    getDataCols(columns) {
      return this.mapTree(columns, [], "columns");
    },
    /**
     * @param: srcArray 源数组
     * @param: mapArray 目标数组
     * @param: key 关键字
     */
    mapTree(srcArray, mapArray, key) {
      let i = 0;
      let len = srcArray.length;
      let col;
      for (; i < len; ) {
        col = srcArray[i++];
        col[key] ? this.mapTree(col[key], mapArray, key) : mapArray.push(col);
      }
      return mapArray;
    },
    // 根据传入的parent对表格数据进行排序，相同的排在一起
    // sortTableData() {
    //   let oldData = this.data.concat()
    //   let data = []
    //   let parent = this.getParentCell()
    //   for (let i = 0; i < oldData.length; i++) {
    //     if (oldData[i] === '') continue
    //     // 由于嵌套循环会跳过当前元素，故先将当前元素加入数组
    //     data.push(oldData[i])
    //     // debugger
    //     for (let j = i + 1; j < oldData.length; j++) {
    //       if (oldData[i][parent] === oldData[j][parent]) {
    //         data.push(oldData[j])
    //         oldData[j] = ''
    //       }
    //     }
    //   }
    //   return data
    // },
    // 获取要合并的行
    getCombineCells() {
      let arr = [];
      this.options.columns.forEach(item => {
        if (item.combine) {
          arr.push(item.name);
        }
      });
      return arr;
    },
    // 获取合并行以那列为准
    getParentCell() {
      let parent = "";
      this.options.columns.some(item => {
        if (item.parent) {
          parent = item.name;
          return true;
        }
      });
      return parent;
    },
    // 根据传入的combineKeyCell及combineCells字段对表格行合并
    combineCell() {
      // let list = this.sortTableData()
      let list = this.data.concat();
      // 加上concat以实现特殊的浅拷贝，不会改变原数组
      let templist = list.concat();
      let parent = this.getParentCell();
      let combineCells = this.getCombineCells();
      let finalList = [];
      let prelen = 0;
      let recursionQuery = () => {
        // tempList: 原数组删除合并过的元素返回的数组
        // let len = templist.filter(val => templist[0][parent] === val[parent]).length
        // debugger
        if (!templist.length) return;
        let len = 1;
        for (let i = 0; i < templist.length - 1; i++) {
          try {
            if (
              templist[0][parent] === templist[i][parent] &&
              templist[i][parent] === templist[i + 1][parent]
            ) {
              len++;
            }
            if (templist[i][parent] !== templist[i + 1][parent]) break;
          } catch (error) {
            /*eslint no-console: 0*/
            console.log(templist);
          }
        }
        // newArr: 当前要合并元素组成的数组
        let newArr = list.slice(prelen, prelen + len).concat();
        for (let field of combineCells) {
          let k = 0;
          while (k < len) {
            if (typeof newArr[k] !== "object") {
              /*eslint no-console: 0*/
              console.error(`数组${newArr}中有一个空值，序号为${k}`);
              k++;
              continue;
            }
            newArr[k][field + "span"] = 1;
            newArr[k][field + "dis"] = false;
            let i = k + 1;
            for (let i; i <= len - 1; i++) {
              if (
                newArr[i - 1][field] === newArr[i][field] &&
                newArr[i][field] !== ""
              ) {
                newArr[k][field + "span"]++;
                newArr[k][field + "dis"] = false;
                newArr[i][field + "span"] = 1;
                newArr[i][field + "dis"] = true;
              } else {
                break;
              }
            }
            k = i;
          }
        }
        templist = templist.slice(len);
        prelen = prelen + len;
        finalList = finalList.concat(newArr);
        // 递归合并下一个要合并的元素
        return recursionQuery();
      };
      recursionQuery();
      return finalList;
    },
    // 渲染标题
    renderTitle(field) {
      return typeof field.title === "undefined"
        ? field.name.replace(".", " ")
        : field.title;
    },
    /**
     * @argument:object   表格数据
     * @argument: field    当前行的名称
     * @return: obj       当前行的数据
     */
    getObjectValue(object, field) {
      let defaultValue = null;
      if (
        typeof this.options.defaultValue === "undefined" &&
        typeof field.defaultValue === "undefined"
      ) {
        defaultValue = null;
      } else {
        defaultValue = field.defaultValue || this.options.defaultValue;
      }
      let obj = object;
      let path = field.name;
      if (path.trim() !== "") {
        let keys = path.split(".");
        keys.forEach(function(key) {
          if (
            obj !== null &&
            typeof obj[key] !== "undefined" &&
            obj[key] !== null &&
            obj[key] !== ""
          ) {
            obj = obj[key];
          } else {
            obj = defaultValue;
          }
        });
      }
      if (field.formatter) {
        obj = this.formatter(field, object, obj);
      }
      return obj;
    },
    formatter(field, object, data) {
      let method = field.formatter;
      let result;
      switch (method) {
        case "currency":
          if (isNaN(data)) {
            result = data;
            // throw new Error(`${data} can not convert to a Number`)
          } else {
            const parts = Number(data)
              .toFixed(2)
              .toString()
              .split(".");
            result =
              parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") +
              "." +
              parts[1];
          }
          break;
        default:
          if (typeof method !== "function") {
            throw new Error(`formatter ${method} is not found`);
          }
          result = method(object);
      }
      return result;
    },
    // 全选与全不选
    toggleAllCheckboxes(e) {
      let isChecked = e.target.checked;
      if (isChecked) {
        this.tableData.forEach((data, index) => {
          this.selectId(index, data);
        });
      } else {
        // this.tableData.forEach((data, index) => {
        //   this.unSelectId(index, data)
        // })
        this.selectedTo = [];
        this.multipleSelection = [];
      }
    },
    // 检查全选复选框状态
    checkCheckboxesState() {
      if (!this.tableData) return;
      let el = document.querySelectorAll(
        "input[type=checkbox].table-th__checkbox"
      )[0];
      if (this.selectedTo.length <= 0) {
        el.indeterminate = false;
        return false;
      } else if (this.selectedTo.length < this.tableData.length) {
        el.indeterminate = true;
        return true;
      } else {
        el.indeterminate = false;
        el.checked = true;
        return true;
      }
    },
    // 选中指定的复选框
    selectId(key, data) {
      if (!this.isSelectedRow(key)) {
        this.selectedTo.push(key);
        this.multipleSelection.push(data);
      }
    },
    // 取消选中指定的复选框
    unSelectId(key) {
      let index = this.selectedTo.findIndex(item => item === key);
      this.selectedTo.splice(index, 1);
      this.multipleSelection.splice(index, 1);
    },
    // 当前行是否被选中
    isSelectedRow(key) {
      return this.selectedTo.indexOf(key) >= 0;
    },
    // 切换复选框选择状态
    toggleCheckbox(data, index, event) {
      let isChecked = event.target.checked;
      if (isChecked) {
        this.selectId(index, data);
      } else {
        this.unSelectId(index, data);
      }
      this.checkCheckboxesState();
    },
    rowSelected(index) {
      return this.isSelectedRow(index);
    },
    // 当表格出现滚动条时计算表头的宽度，当窗体宽度改变时计算表格宽度
    recaculateTableWidth() {
      let scrollBarWidth = this.getScrollBarWidth();
      let thEl = this.$el.querySelector(".supplement-th");
      let tdEl = this.$el.querySelector(".supplement-td");
      // let table = this.$el.querySelector('.table-wrapper__div')
      // let main = document.getElementsByClassName('main-layout')[0]
      // 当表格宽度大于窗体宽度或者每列均设置了宽度时，固定表格宽度，高度设置是为了消除横向滚动条导致的影响
      // if (this.tableWidth > main.offsetWidth || this.allWidth) {
      //   table.style.width = this.tableWidth + 20 + 'px'
      //   if (scrollBarWidth) {
      //     table.style.height = this.$el.offsetHeight - scrollBarWidth - 2 + 'px'
      //   }
      // } else {
      //   table.style.width = ''
      //   table.style.maxHeight = '100%'
      //   table.style.height = ''
      // }
      if (this.data && this.data.length) {
        thEl.style.display = "table-cell";
        thEl.style.width = scrollBarWidth + "px";
      } else {
        thEl.style.display = "none";
      }
      if (tdEl) tdEl.style.width = scrollBarWidth + "px";
    },
    scrolled() {
      this._tableHead.scrollLeft = this._tableBody.scrollLeft;
    },
    // 获取滚动条宽度
    getScrollBarWidth() {
      let el = this.$el.querySelector(".table-body__div");
      if (el) return el.offsetWidth - el.clientWidth;
    },
    // 合计行
    getTotal(data, index) {
      if (data.summaryTitle) {
        return data.summaryTitle;
      }
      if (!index) {
        return "汇总";
      }
      if (data.summaryMethod) {
        let total = 0;
        // 默认提供求和、求平均数，支持自定义事件
        switch (data.summaryMethod) {
          case "sum":
            this.tableData.forEach(d => {
              total += Number(d[data.name]);
            });
            break;
          case "avg":
            this.tableData.forEach(d => {
              total += Number(d[data.name]);
            });
            total = total / this.tableData.length;
            break;
          default: {
            let arr = [];
            this.tableData.forEach(d => {
              arr.push(d[data.name]);
            });
            if (typeof data.summaryMethod !== "function") {
              throw new Error(`${data.summaryMethod} method is not found`);
            }
            if (!arr.length) return;
            total = data.summaryMethod(arr);
          }
        }
        return total;
      }
      if (data.summaryText) {
        return data.summaryText;
      }
    },
    // 获取当前列的数据
    getColData(field) {
      let arr = [];
      if (field.columns && field.columns.length) {
        let recursion = columns => {
          columns.forEach(col => {
            col["columns"] ? recursion(col["columns"]) : arr.push(col["name"]);
          });
        };
        recursion(field.columns);
      } else {
        arr.push(field["name"]);
      }
      let colDatas = [];
      arr.forEach(item => {
        colDatas.push(
          this.tableData.map(val => {
            return val[item];
          })
        );
      });
      return colDatas;
    }
  }
};
</script>

<style lang="less">
.component-table__wrapper {
  width: 100%;
  height: 100%;
  background: #fff;
  overflow: auto;
  position: relative;

  table {
    table-layout: fixed;

    th, td {
      display: table-cell;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0 4px;
    }

    .supplement-th {
      padding: 0;
    }
  }

  .table-wrapper__div {
    height: 100%;
  }

  .table-head__div {
    overflow: hidden;
    background: #eef1f6;

    tr {
      border-top: 1px solid #0ba0ff;
      border-bottom: 1px solid #dce1e6;
    }

    th {
      border-right: 1px solid #dce1e6;
      font-weight: 500;
      color: #1f2d3d;
    }
  }

  .table-body__div {
    overflow: auto;
    height: 100%;

    tr {
      height: 38px;
    }

    &.border {
      tr {
        border-bottom: 1px solid #dce1e6;
      }

      td {
        border-right: 1px solid #dce1e6;
      }
    }
  }

  .table-footer__div {
    background: #eef1f6;

    tr {
      border-bottom: 1px solid #dce1e6;
      border-top: 1px solid #dce1e6;
    }

    td {
      height: 38px;
      border-right: 1px solid #dce1e6;
      color: #666;
    }
  }

  .strip .table-body__tr {
    &:nth-child(2n+1) {
      td:not([rowspan]), td[rowspan='1'] {
        background-color: #f4f6f8;
      }
    }

    &:hover {
      td:not([rowspan]), td[rowspan='1'] {
        background-color: #e6f5ff;
        color: #1f2d3d;
      }
    }
  }

  .empty-data {
    text-align: center;
    padding-top: 20px;
  }

  .mask {
    position: absolute;
    z-index: 10000;
    background-color: hsla(0, 0%, 100%, 0.9);
    margin: 0;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transition: opacity 0.3s;
  }

  .loading-spinner {
    top: 50%;
    transfrom: translateY(-50%);
    width: 100%;
    text-align: center;
    position: absolute;

    .circular {
      width: 42px;
      height: 42px;
      animation: loading-rotate 2s linear infinite;

      .path {
        animation: loading-dash 1.5s ease-in-out infinite;
        stroke-dasharray: 90, 150;
        stroke-dashoffset: 0;
        stroke-width: 2;
        stroke: #20a0ff;
        stroke-linecap: round;
      }
    }
  }
}
</style>
