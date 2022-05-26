# Copyright (c) 2022 The Brave Authors. All rights reserved.
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/. */

import contextlib
import types


def override_check(scope, name=None):
    """Replaces existing PRESUBMIT checks. Can be used with globals()
    scope or a class scope (such as input_api.canned_checks)."""
    def decorator(new_func):
        is_dict_scope = isinstance(scope, dict)
        check_name = name or new_func.__name__
        if is_dict_scope:
            original_check = scope.get(check_name, None)
        else:
            original_check = getattr(scope, check_name, None)

        if not callable(original_check):
            print(f'WARNING: {check_name} check to override not found.\n'
                  'Please update chromium_presubmit_overrides.py!')

            def noop_check(*_, **__):
                return []

            return noop_check

        def wrapped_f(*args, **kwargs):
            return new_func(original_check, *args, **kwargs)

        if is_dict_scope:
            scope[check_name] = wrapped_f
        else:
            setattr(scope, check_name, wrapped_f)

        return wrapped_f

    return decorator


def get_first_check_name(scope):
    """Returns first Check* method from the scope."""
    assert isinstance(scope, dict)
    for key, value in scope.items():
        if key.startswith('Check') and callable(value):
            return key
    raise LookupError('Check* method not found in scope')


@contextlib.contextmanager
def override_class_method(clazz, new_method, name=None):
    """Scoped class method override helper."""
    method_name = name or new_method.__name__
    original_method = getattr(clazz, method_name)
    try:
        if not callable(original_method):
            raise NameError(f'Failed to override class method: '
                            f'{original_method} not found or not callable')

        def wrapped_f(self, *args, **kwargs):
            return new_method(self, original_method, *args, **kwargs)

        setattr(clazz, method_name, types.MethodType(wrapped_f, clazz))
        yield
    finally:
        if original_method:
            setattr(clazz, method_name, original_method)
