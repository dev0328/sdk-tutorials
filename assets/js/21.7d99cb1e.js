(window.webpackJsonp=window.webpackJsonp||[]).push([[21],{546:function(t,s,e){},630:function(t,s,e){"use strict";e(546)},679:function(t,s,e){"use strict";e.r(s);e(38),e(9);var _={props:["module","startExpanded"],data:function(){return{expanded:this.startExpanded||!1}},computed:{submodules:function(){var t=this;return this.module.submodules.filter((function(s){return s.url!=t.$page.path}))}},methods:{toggleContent:function(t){this.expanded=!this.expanded}}},i=(e(630),e(1)),a=Object(i.a)(_,(function(){var t=this,s=t.$createElement,e=t._self._c||s;return e("div",{staticClass:"module__wrapper",on:{click:t.toggleContent}},[e("div",{staticClass:"module"},[e("div",{staticClass:"module__number tm-overline tm-rf-1 tm-lh-title tm-medium tm-muted mt-2"},[t._v("module "+t._s(this.module.number))]),e("div",{staticClass:"module__content__wrapper"},[e("div",{staticClass:"module__content"},[e("h4",{staticClass:"module__content__title"},[t._v(t._s(this.module.title))]),e("div",{staticClass:"module__content__desc"},[t._v(t._s(this.module.description))])]),e("div",{staticClass:"module__actions"},[e("div",{staticClass:"module__actions__toggle"},[e("div",{staticClass:"module__actions__toggle__label"},[t._v(t._s(t.submodules.length)+" pages")]),e("icon-arrow",{staticClass:"module__actions__toggle__icon",class:t.expanded?"hide-icon":"show-icon",attrs:{type:"bottom"}})],1),e("a",{staticClass:"module__actions__start tm-button",attrs:{href:this.module.url},on:{click:t.toggleContent}},[t._m(0)])]),e("div",{directives:[{name:"show",rawName:"v-show",value:t.expanded,expression:"expanded"}],staticClass:"module__submodules"},t._l(t.submodules,(function(s){return e("a",{staticClass:"module__submodules__item",attrs:{href:s.url},on:{click:t.toggleContent}},[e("div",{staticClass:"module__submodules__item__content"},[e("h5",{staticClass:"module__submodules__item__content__title"},[e("span",[t._v(t._s(s.title))])]),e("div",{staticClass:"module__submodules__item__content__desc"},[t._v(t._s(s.description))])]),s.tag&&t.$themeConfig.tags[s.tag]?e("div",{staticClass:"module__submodules__item__badge mb-4",style:{background:t.$themeConfig.tags[s.tag].color||""}},[t._v(t._s(t.$themeConfig.tags[s.tag].label||""))]):t._e(),e("div",{staticClass:"module__submodules__item__start"},[e("div",{staticClass:"module__submodules__item__start__icon"},[e("icon-arrow",{attrs:{type:"right"}})],1),t._m(1,!0)])])})),0)])])])}),[function(){var t=this.$createElement,s=this._self._c||t;return s("div",{staticClass:"tm-link tm-link-disclosure"},[s("span",[this._v("Start here")])])},function(){var t=this.$createElement,s=this._self._c||t;return s("div",{staticClass:"module__submodules__item__start__label tm-link tm-link-disclosure"},[s("span",[this._v("Start here")])])}],!1,null,"c969fabe",null);s.default=a.exports}}]);