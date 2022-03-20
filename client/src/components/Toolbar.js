import ButtonGroup from "react-bootstrap/ButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";

import React, { useState } from "react";

const carrierDisplayNames = {
  carrier: "Carrier (75)",
  carrier2: "Dreadnought (100)",
  carrier3: "Mothership (125)",
};

const planitaryShieldDisplayNames = {
  shield: "Planitary Shield (75)",
  shield2: "Planitary Shield Lvl 2 (100)",
  shield3: "Planitary Shield Lvl 3 (125)",
};

const missileDisplayNames = {
  missile: "Missile (2)",
  missile2: "Nuclear Missile (25)",
  missile3: "Deatomizer Missile (70)",
};

function Toolbar(props) {
  const [radioValue, setRadioValue] = useState("fighter");

  const [carrierValue, setCarrierValue] = useState("carrier");
  const [planitaryShieldValue, setPlanitaryShield] = useState("shield");
  const [missileValue, setMissile] = useState("missile");

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
      }}
    >
      <ButtonGroup>
        <ToggleButton
          key="fighter"
          id={`radio-fighter`}
          type="radio"
          variant={"outline-info"}
          name="radio"
          value={"fighter"}
          checked={radioValue === "fighter"}
          onChange={(e) => {
            props.changeVehicle("fighter");
            setRadioValue("fighter");
          }}
        >
          Fighter (5)
        </ToggleButton>

        <Dropdown
          as={ButtonGroup}
          style={{ marginLeft: "3px" }}
          onSelect={(e) => {
            setMissile(e);
            setRadioValue("missile");
            props.changeVehicle(e);
          }}
        >
          <ToggleButton
            key="missile"
            id={`radio-missile`}
            type="radio"
            variant={"outline-info"}
            name="radio"
            value={"missile"}
            checked={radioValue === "missile"}
            onChange={(e) => {
              props.changeVehicle(missileValue);
              setRadioValue("missile");
            }}
          >
            {missileDisplayNames[missileValue]}
          </ToggleButton>

          <Dropdown.Toggle
            split
            variant="outline-info"
            id="dropdown-split-basic"
          />

          <Dropdown.Menu variant="outline-info">
            {Object.entries(missileDisplayNames).map(([id, name]) => (
              <Dropdown.Item active={missileValue === id} eventKey={id}>
                {name}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown
          as={ButtonGroup}
          style={{ marginLeft: "3px" }}
          onSelect={(e) => {
            setPlanitaryShield(e);
            setRadioValue("planitary-shield");
            props.changeVehicle(e);
          }}
        >
          <ToggleButton
            key="planitary-shield"
            id={`radio-planitary-shield`}
            type="radio"
            variant={"outline-info"}
            name="radio"
            value={"planitary-shield"}
            checked={radioValue === "planitary-shield"}
            onChange={(e) => {
              props.changeVehicle(planitaryShieldValue);
              setRadioValue("planitary-shield");
            }}
          >
            {planitaryShieldDisplayNames[planitaryShieldValue]}
          </ToggleButton>

          <Dropdown.Toggle
            split
            variant="outline-info"
            id="dropdown-split-basic"
          />

          <Dropdown.Menu variant="outline-info">
            {Object.entries(planitaryShieldDisplayNames).map(([id, name]) => (
              <Dropdown.Item active={planitaryShieldValue === id} eventKey={id}>
                {name}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown
          as={ButtonGroup}
          style={{ marginLeft: "3px" }}
          onSelect={(e) => {
            setCarrierValue(e);
            setRadioValue("carrier");
            props.changeVehicle(e);
          }}
        >
          <ToggleButton
            key="carrier"
            id={`radio-carrier`}
            type="radio"
            variant={"outline-info"}
            name="radio"
            value={"carrier"}
            checked={radioValue === "carrier"}
            onChange={(e) => {
              props.changeVehicle(carrierValue);
              setRadioValue("carrier");
            }}
          >
            {carrierDisplayNames[carrierValue]}
          </ToggleButton>

          <Dropdown.Toggle
            split
            variant="outline-info"
            id="dropdown-split-basic"
          />

          <Dropdown.Menu variant="outline-info">
            {Object.entries(carrierDisplayNames).map(([id, name]) => (
              <Dropdown.Item active={carrierValue === id} eventKey={id}>
                {name}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <ToggleButton
          style={{ marginLeft: "3px" }}
          key="commander"
          id={`radio-commander`}
          type="radio"
          variant={"outline-info"}
          name="radio"
          value={"commander"}
          checked={radioValue === "commander"}
          onChange={(e) => {
            props.changeVehicle("commander");
            setRadioValue("commander");
          }}
        >
          Commander (25)
        </ToggleButton>
      </ButtonGroup>

      <ButtonGroup style={{ paddingLeft: "10px" }}>
        <Button variant={"outline-info"} onClick={props.centerViewport}>
          <FontAwesomeIcon icon={faLocationCrosshairs} />
        </Button>
      </ButtonGroup>
    </div>
  );
}

export default Toolbar;
