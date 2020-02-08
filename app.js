App({
  onLaunch() {
    const res = wx.getSystemInfoSync();
    console.log('sysInfo:', res);
  }
});
