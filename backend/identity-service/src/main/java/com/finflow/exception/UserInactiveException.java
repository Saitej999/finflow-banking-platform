package com.finflow.exception;

/**
 * Thrown when a user is not allowed to authenticate due to status.
 */
public class UserInactiveException extends RuntimeException {
    public UserInactiveException(String message) {
        super(message);
    }
}
