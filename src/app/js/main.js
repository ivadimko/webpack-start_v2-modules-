import '../css/main.scss';
import './widgets/form.js';


import '../../modules/module_social-buttons/js/_module';




window.onload = function () {

};

$(document).ready(function () {

    $('.anchor').on('click', function (e) {
        e.preventDefault();

        let target = this.hash,
            $target = $(target);


        $('html, body').stop().animate({
            scrollTop: $target.offset().top
        }, 500, 'swing');
    });

});