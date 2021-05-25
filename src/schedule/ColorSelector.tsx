import React, { useEffect, useState } from "react";
import { withStyles } from "@material-ui/core/styles";
import { red, teal, yellow, orange, lightBlue } from "@material-ui/core/colors";
import Radio, { RadioProps } from "@material-ui/core/Radio";

const RedRadio = withStyles({
  root: {
    padding: 7,
    color: red[400],
    "&$checked": {
      color: red[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);

const TealRadio = withStyles({
  root: {
    padding: 7,
    color: teal[400],
    "&$checked": {
      color: teal[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);

const YellowRadio = withStyles({
  root: {
    padding: 7,
    color: yellow[400],
    "&$checked": {
      color: yellow[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);

const LightBlueRadio = withStyles({
  root: {
    padding: 7,
    color: lightBlue[400],
    "&$checked": {
      color: lightBlue[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);

const OrangeRadio = withStyles({
  root: {
    padding: 7,
    color: orange[400],
    "&$checked": {
      color: orange[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);

const ColorSelector = ({ value, onChange, disabled }: any) => {
  const [selectedValue, setSelectedValue] = useState<string | null>(value);

  useEffect(() => {
    if (value !== selectedValue) {
      setSelectedValue(value);
    }
  }, [value, selectedValue]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event);
    }
    setSelectedValue(event.target.value);
  };

  return (
    <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
      <RedRadio
        disabled={disabled}
        checked={selectedValue === red[400]}
        onChange={handleChange}
        value={red[400]}
        name="color-selector"
        size="small"
        inputProps={{ "aria-label": "Red" }}
      />
      <OrangeRadio
        disabled={disabled}
        checked={selectedValue === orange[400]}
        onChange={handleChange}
        value={orange[400]}
        name="color-selector"
        size="small"
        inputProps={{ "aria-label": "Orange" }}
      />
      <YellowRadio
        disabled={disabled}
        checked={selectedValue === yellow[400]}
        onChange={handleChange}
        value={yellow[400]}
        name="color-selector"
        size="small"
        inputProps={{ "aria-label": "Yellow" }}
      />
      <TealRadio
        disabled={disabled}
        checked={selectedValue === teal[400]}
        onChange={handleChange}
        value={teal[400]}
        name="color-selector"
        size="small"
        inputProps={{ "aria-label": "Teal" }}
      />
      <LightBlueRadio
        disabled={disabled}
        checked={selectedValue === lightBlue[400]}
        onChange={handleChange}
        value={lightBlue[400]}
        name="color-selector"
        size="small"
        inputProps={{ "aria-label": "Light Blue" }}
      />
    </div>
  );
};

export default ColorSelector;
