基于vue2.x写的一个table组件 vue >= 2.1.0
```json
options: {
  columns: [
    {
      title: "客户名称",
      name: "companyName",
      combine: true,
      parent: true,
      width: 220,
      align: "left",
    },
    { title: "申报月份", name: "date", combine: true, width: 60 },
    { title: "分类", name: "taxOffice", combine: true, width: 40 },
    { title: "税种", name: "taxType", width: 140, align: "left" },
    {
      title: "税期",
      name: "period",
      width: 110,
      columns: [
        { title: "税期起", name: "periodBegin", width: 55 },
        { title: "税期止", name: "periodEnd", width: 55 },
      ],
    },
    {
      title: "计税依据",
      name: "salesAmount",
      formatter: "currency",
      align: "right",
      width: 85,
      tooltip: true,
    },
    {
      title: "应补退税额",
      name: "taxPayable",
      formatter: "currency",
      align: "right",
      width: 85,
      tooltip: true,
    },
    { title: "状态", name: "phase", width: 60 },
    {
      title: "报税员",
      name: "taxPreparerName",
      combine: true,
      width: 70,
    },
    { title: "申报人", name: "submitName", width: 70 },
    { title: "最终申报时间", name: "submitDate", width: 130 },
  ],
  defaultValue: "--",
},
data: [
  {
    companyName: "深圳市腾讯计算机系统有限公司",
    date: "2019-01",
    taxOffice: "税务局",
    taxType: "增值税",
    periodBegin: "2019-01-01",
    periodEnd: "2019-01-31",
    salesAmount: "1,000,000.00",
    taxPayable: "1,000,000.00",
    phase: "已申报",
    taxPreparerName: "张三",
    submitName: "李四",
    submitDate: "2019-01-01",
  }
],
```
