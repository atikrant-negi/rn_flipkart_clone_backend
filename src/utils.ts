export const CONSTANTS = {
    EMPTY_FIELD: 'body contains empty of missing fields',
    CRED_INVALID: 'invalid credentials' ,
    ERROR_404: '404, not found',
    ERROR_500: '500, internal error',

    CREATED: {
        USER: 'user created successfully'
    },
    PREEXISTING: {
        USER: 'phone or email already exists'
    },
    DELETED: {
        SESSION: 'session destroyed'
    }
};

export const isEmpty = (field: any) => {
    return (field == undefined || field == '')
};

export const anyEmpty = (...fields: any) => {
    for (let x of fields) {
        if (isEmpty(x)) return true;
    }
    return false;
};

export const allEmpty = (...fields: any) => {
    for (let x of fields) {
        if (!isEmpty(x)) return false;
    }
    return true;
}