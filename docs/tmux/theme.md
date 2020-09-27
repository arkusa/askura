# THEME

tmux的主题基本是指**状态栏**的配置

本人**tmux**小白

我的配置是基于[Oh My Tmux!!!](https://github.com/gpakosz/.tmux)更改的

![my example](/imgs/tmux/tmux.example.png)

## Oh My Tmux

如果你不想阅读tmux手册, 且想拥有向上面一样漂亮的**status bar**的话, **Oh My Tmux**是一个很好的选择

**Oh My Tmux**是**gpakosz**的**tmux**配置, 我这里主要应用了**status bar**的配置(`.tmux.conf.local`)

对于其他相关内容的配置, 我计划是了解**tmux**功能后按照自己的习惯更改

### Install
```shell
cd
git clone https://github.com/gpakosz/.tmux.git
ln -s -f .tmux/.tmux.conf
cp .tmux/.tmux.conf.local .
```

::: warning 注意

这里`ln -s -f .tmux/.tmux.conf`将`~/.tmux.conf`软链到了`~/.tmux/.tmux.conf`上

所以如果你有`tmux.conf`配置的话, 记得备份😯 !

:::

### Status Bar Conf

tmux_conf_theme_status_left='  🐷 #S  |  ⌚️ #{?uptime_y, #{uptime_y}y,}#{?uptime_d, #{uptime_d}d,}#{?uptime_h, #{uptime_h}h,}#{?uptime_m, #{uptime_m}m,}  '
tmux_conf_theme_status_right='#{prefix}#{pairing}#{synchronized} #{?battery_status, #{battery_status},}#{?battery_bar, #{battery_bar},}#{?battery_percentage, #{battery_percentage},} , %R , %b %d |        临渊羡鱼不如退而结网     |    askura ♥    '

# status left style
tmux_conf_theme_status_left_fg='#000000,#e4e4e4'  # black, white , white
tmux_conf_theme_status_left_bg='#ffff00,#ff00af,#FF8C00'  # yellow, pink, white blue
tmux_conf_theme_status_left_attr='bold,none,none'

# status right style
tmux_conf_theme_status_right_fg='#8a8a8a,#e4e4e4,#000000' # light gray, white, black
tmux_conf_theme_status_right_bg='#080808,#6FB668,#e4e4e4' # dark gray, red, white
tmux_conf_theme_status_right_attr='none,none,bold'

tmux_conf_theme_left_separator_main='\uE0B0'  # /!\ you don't need to install Powerline
tmux_conf_theme_left_separator_sub='\uE0B1'   #   you only need fonts patched with
tmux_conf_theme_right_separator_main='\uE0B2' #   Powerline symbols or the standalone
tmux_conf_theme_right_separator_sub='\uE0B3'  #   PowerlineSymbols.otf font, see README.md


tmux_conf_battery_status_charging='🔌'     # U+1F50C
tmux_conf_battery_status_discharging='🔋'  # U+1F50B

tmux_conf_battery_bar_symbol_full='♥'
tmux_conf_battery_bar_symbol_empty='·'

