---
home: true
heroImage: /sakura_saber.jpeg
heroText: Wow!!
tagline: sakura saber(没找好满意的阿尔托莉雅)
actionText: 欢迎issues →
actionLink: https://github.com/arkusa/askura/issues
footer: MIT Licensed | Copyright © 2020-present arkusa

---

<script>
export default {
  mounted() {
    const a = document.querySelector('.nav-link.external.action-button');
    const svg = a.getElementsByTagName('svg')[0];
    a.removeChild(svg);
  }
}
</script>

