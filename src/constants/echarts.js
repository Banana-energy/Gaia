export const commonOptions = {
  title: [{
    left: '50%',
    top: '85%',
    textAlign: 'center',
    subtextStyle: {
      fontSize: '16'
    }
  }, {
    left: '50%',
    top: '-3%',
    textAlign: 'center',
    subtextStyle: {
      fontSize: '16'
    }
  }],
  tooltip: {
    trigger: 'item',
    confine: true
  },
  series: [
    {
      type: 'pie',
      radius: ['70%', '80%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: false
        }
      }
    }
  ]
}
