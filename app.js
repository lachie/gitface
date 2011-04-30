app = require('./lib/app')
Config = require('./lib/config')

if (!module.parent) {
  Config.getUserConfig(function(err, cfg) {
    if(err) throw err;

    app.listen(cfg.port);
    console.log("Express server listening on port %d", app.address().port);
  })
}
