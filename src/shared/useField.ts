import { useCallback, useState } from "react";

export interface IFieldEvent {
  target: {
    value: any;
  };
}

/**
 * Generic field handler
 *
 * @param defaultValue null
 * @param isRequired true
 * @returns value, clear, onChange, onBlur, error
 */
const useField = <T>(
  defaultValue: T | null = null,
  isRequired: boolean = true
) => {
  const [value, setValue] = useState<T | null>(defaultValue);
  const [error, setError] = useState<boolean>(false);

  const onChange = useCallback((event: IFieldEvent, index?: number) => {
    setValue((prev) => {
      const newValue = event.target.value;

      if (!Array.isArray(prev)) return newValue;
      if (!index) return newValue;

      const result = [...prev];
      result[index] = newValue;

      return result;
    });
    setError(false);
  }, []);

  const onBlur = useCallback(() => {
    if (!value && isRequired) setError(true);
  }, [value, isRequired]);

  const clear = useCallback(() => {
    setValue(defaultValue);
    setError(false);
  }, [defaultValue]);

  const validate = useCallback(
    (expectedLength: number = 1) => {
      let newError = !value && isRequired ? true : false;

      if (Array.isArray(value) && isRequired && !newError) {
        newError =
          value.length < expectedLength || value.find((x) => !x) ? true : false;
      }

      setError(newError);
    },
    [isRequired, value]
  );

  return {
    value,
    validate,
    clear,
    onChange,
    onBlur,
    error,
  };
};

export default useField;
