# DiscordRichText - BetterDiscord plugin
Enable discord rich text formatting for plugin users. Seamless for non-users.
Works using custom-made invisible base16 encoder and decoder.
(`num_base16e`, `ascii_base16d` etc.)

## Demonstration
### Plugin user
![image](https://user-images.githubusercontent.com/39013925/142848796-dabb1d28-b2a3-4d59-82cf-b0115f031d71.png)

### Non-user
![image](https://user-images.githubusercontent.com/39013925/142848978-3968bebc-0e02-4118-98bd-cd69757a8f89.png)

## Usage
All formatted messages must be preceded by the `[formatted]` tag. If not, the other tags will still be parsed, but they won't work.

Implemented tags:
  - [h1], [h2], [h3], [h4]
    - Aliases for [size], but with different sizes
  - [size px]
    - Set font size in pixels
  - [color #hex]
    - Set text color in hex
  - [highlight #hex]
    - Set text highlight in hex
  - [style name]
    - Set different styles: `blink` (to be implemented), `marquee` (moving text/images), `center` (center objects)
  - [marquee]
    - Alias for [style marquee]
  - [center]
    - Alias for [style center]
  - [image src width? height?]
    - Display image. Only `discordapp.com` and `discord.com` domains allowed. Default width and height are 320x180

## Example
```
[formatted][marquee][h2]--- Welcome to my server! ---[/h2][/marquee]

[center][color #ff0000][h3]Rules[/h3][/color]
...
...
...
[/center]

[center][color #ff00ff][h3]Channels[/h3][/color]
...
...
...
[/center]

[marquee]------Have fun!------[/marquee]
```
![image](https://user-images.githubusercontent.com/39013925/142909921-4a33db02-68ac-4a35-90de-53eadc6b8c13.png)

![image](https://user-images.githubusercontent.com/39013925/142910139-0f0d2695-fc49-41c1-9de9-613084bbeef5.png)

