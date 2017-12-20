const VALIDATION_TYPES = {
        required: 0,
        email: 1,
        phone: 2
    }
    , dictionary = window.config && window.config.dictionary
    , CAPTCHA_API = "https://www.google.com/recaptcha/api.js"
;

function extractValidationTypes(string) {
    const matches = string.match(/_validate-(\S+)/g) || [];
    return matches.map(string => string.substr(10))
        .filter(string => string in VALIDATION_TYPES);
}

function validate(string, type) {
    switch (type) {
        case VALIDATION_TYPES.required:
            return !!string;
        case VALIDATION_TYPES.email:
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(string);
        case VALIDATION_TYPES.phone:
            const digits = string.replace(/[-\s\+\(\)]/g, '');
            return /^\d{7,}$/.test(digits);
    }
}

$.fn.ultraInputBlock = function (config = {}) {
    return this.each((i, el) => {
        if (!el.inputBlock) el.inputBlock = {};
        const $self = $(el)
            , $label = $self.find('.label')
            , $input = $self.find('.input, .textarea')
            , $error = $self.find('.input-block__error')
            , state = el.inputBlock
            , {liveValidation = false} = config
        ;
        let wasFocusedOut = false;
        $input.on('focusin focusout', e => {
            $label.toggleClass('label_scaled', !!$input.val() || e.type === "focusin");
            if (liveValidation && !wasFocusedOut && e.type === 'focusout') {
                wasFocusedOut = true;
                $self.trigger('validate');
            }
        });
        $self.on('validate', () => {
            const validationTypes = extractValidationTypes($self.attr("class"))
                , validationErrors = []
            ;
            state.valid = true;
            for (let i = 0; i < validationTypes.length; i++) {
                if (!validate($input.val(), VALIDATION_TYPES[validationTypes[i]])) {
                    validationErrors.push(dictionary[`error_${validationTypes[i]}`].replace("%1", $label.text()));
                    state.valid = false;
                }
            }
            if (state.valid === false) {
                $error.text(validationErrors.join("; "));
            }
            $self.toggleClass('input-block_valid', state.valid)
                .toggleClass('input-block_invalid', !state.valid);
        });
        $self.on('clean', () => {
            $input.val('').trigger('focusout');
            $self.removeClass('input-block_valid input-block_invalid');
        });
        if (liveValidation) {
            $input.on('keyup cut paste', () => {
                if (wasFocusedOut) {
                    $self.trigger('validate');
                }
            });
        }
    })
};

$.fn.ultraForm = function (config) {
    if (!window.ultraForm) {
        window.ultraForm = {$currentForm: $()};
        window.ultraFormCallback = token => {
            window.ultraForm.$currentForm.trigger('progressStart', [token]);
        };
    }
    const globals = window.ultraForm;
    return this.each((i, el) => {
        const $self = $(el)
            , $inputBlocks = $(el).find('.input-block')
            , {
                captchaKey = null,
                minProgressDuration = null,
                captchaCallback = new Function(),
                captchaBadge = "bottomright",
                captchaType = "image"
            } = Object.assign({}, config, $self.data())
        ;
        $inputBlocks.ultraInputBlock(config);
        $self.on('submit', e => {
            e.preventDefault();
            $inputBlocks.trigger('validate');
            if (isValid()) {
                globals.$currentForm = $self;
                if (captchaKey) {
                    grecaptcha.execute();
                } else {
                    $self.trigger('progressStart');
                }
            }
        });
        if (captchaKey) {
            const script = document.createElement('script');
            $(document.body).append(script);
            script.onload = () => {
                $self.append($('<div />', {
                    class: 'g-recaptcha',
                    'data-sitekey': captchaKey,
                    'data-callback': 'ultraFormCallback',
                    'data-size': 'invisible',
                    'data-badge': captchaBadge,
                    'data-type': captchaType
                }));
            };
            script.src = CAPTCHA_API;
        }
        $self.on('progressStart', (e, token) => {
            captchaCallback(token);
            let minProgressPassed = !minProgressDuration
                , ajaxData
            ;
            if (minProgressDuration) {
                setTimeout(() => {
                    minProgressPassed = true;
                    if (ajaxData) {
                        $self.trigger('progressEnd', [ajaxData]);
                    }
                }, minProgressDuration);
            }
            $self.trigger('progressEnd'); // delete this string and uncomment block above
            /*$.post($self.attr('action'), $self.serialize(), 'json')
                .done(data => {
                    ajaxData = data;
                    if (minProgressPassed) {
                        $self.trigger('progressEnd', [ajaxData]);
                    }
                })
                .fail((jqXhr, status, error) => {
                    $self.trigger('progressError', [status, error]);
                });*/
        });
        $self.on('progressEnd', () => $inputBlocks.trigger('clean'));
        function isValid() {
            return $inputBlocks.toArray()
                .reduce((prev, curr) => prev && curr.inputBlock && curr.inputBlock.valid, true);
        }
    })
};


$('.form').ultraForm({
    liveValidation: true,
    captchaCallback: token => console.log('token:', token),
    captchaKey: '6Lcl6DUUAAAAANZv3RfiV5Ac1OtTq1np8Qf8K3DK',
    minProgressDuration: 1000
}).on('progressStart progressEnd', e => console.log(e.type));