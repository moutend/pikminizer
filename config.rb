Time.zone = 'Tokyo'
Slim::Engine.default_options[:pretty] = true
Tilt::CoffeeScriptTemplate.default_bare = true

set :css_dir,    'css'
set :js_dir,     'js'
set :images_dir, 'img'
