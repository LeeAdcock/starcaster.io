import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationCrosshairs, faUserGroup } from '@fortawesome/free-solid-svg-icons';

import React, { useEffect, useState } from 'react';

const carrierDisplayNames = {
  carrier: 'Carrier (75)',
  carrier2: 'Dreadnought (100)',
  carrier3: 'Mothership (125)',
};

const planitaryShieldDisplayNames = {
  shield: 'Planitary Shield (75)',
  shield2: 'Planitary Shield Lvl 2 (100)',
  shield3: 'Planitary Shield Lvl 3 (125)',
};

const missileDisplayNames = {
  missile: 'Missile (3)',
  missile4: 'Seaker Missile (10)',
  missile2: 'Nuclear Missile (25)',
  missile3: 'Deatomizer Missile (110)',
};

function Toolbar(props) {
  const [radioValue, setRadioValue] = useState('fighter');

  const [carrierValue, setCarrierValue] = useState('carrier');
  const [planitaryShieldValue, setPlanitaryShield] = useState('shield');
  const [missileValue, setMissile] = useState('missile');

  const [allianceValue, setAlliance] = useState('');
  const [allianceDisplayed, setAllianceDisplayed] = useState(false);

  useEffect(() => {
    props.allianceChange(allianceValue);
  }, [allianceValue]);

  useEffect(() => {
    if (props.alliance.id) {
      setAlliance(props.alliance.id);
    }
  }, [props.alliance]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
      }}
    >
      <ButtonGroup>
        <ToggleButton
          key="fighter"
          id="radio-fighter"
          type="radio"
          variant="outline-info"
          name="radio"
          value="fighter"
          checked={radioValue === 'fighter'}
          onChange={(e) => {
            props.changeVehicle('fighter');
            setRadioValue('fighter');
          }}
        >
          Fighter (5)
        </ToggleButton>

        <Dropdown
          as={ButtonGroup}
          style={{ marginLeft: '3px' }}
          onSelect={(e) => {
            setMissile(e);
            setRadioValue('missile');
            props.changeVehicle(e);
          }}
        >
          <ToggleButton
            key="missile"
            id="radio-missile"
            type="radio"
            variant="outline-info"
            name="radio"
            value="missile"
            checked={radioValue === 'missile'}
            onChange={(e) => {
              props.changeVehicle(missileValue);
              setRadioValue('missile');
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
          style={{ marginLeft: '3px' }}
          onSelect={(e) => {
            setPlanitaryShield(e);
            setRadioValue('planitary-shield');
            props.changeVehicle(e);
          }}
        >
          <ToggleButton
            key="planitary-shield"
            id="radio-planitary-shield"
            type="radio"
            variant="outline-info"
            name="radio"
            value="planitary-shield"
            checked={radioValue === 'planitary-shield'}
            onChange={(e) => {
              props.changeVehicle(planitaryShieldValue);
              setRadioValue('planitary-shield');
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
          style={{ marginLeft: '3px' }}
          onSelect={(e) => {
            setCarrierValue(e);
            setRadioValue('carrier');
            props.changeVehicle(e);
          }}
        >
          <ToggleButton
            key="carrier"
            id="radio-carrier"
            type="radio"
            variant="outline-info"
            name="radio"
            value="carrier"
            checked={radioValue === 'carrier'}
            onChange={(e) => {
              props.changeVehicle(carrierValue);
              setRadioValue('carrier');
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
          style={{ marginLeft: '3px' }}
          key="commander"
          id="radio-commander"
          type="radio"
          variant="outline-info"
          name="radio"
          value="commander"
          checked={radioValue === 'commander'}
          onChange={(e) => {
            props.changeVehicle('commander');
            setRadioValue('commander');
          }}
        >
          Commander (25)
        </ToggleButton>
      </ButtonGroup>

      <ButtonGroup style={{ paddingLeft: '10px' }}>
        <Button variant="outline-info" onClick={props.centerViewport}>
          <FontAwesomeIcon icon={faLocationCrosshairs} />
        </Button>
      </ButtonGroup>

      <OverlayTrigger
        placement="right"
        delay={{ show: 250, hide: 400 }}
        overlay={<Tooltip>Alliance</Tooltip>}
      >
        <InputGroup style={{
          marginLeft: '10px',
          display: 'inline-flex',
          width: 'inherit',
        }}
        >

          <Button variant="outline-info" id="button-addon1" onClick={() => setAllianceDisplayed(!allianceDisplayed)}>
            <FontAwesomeIcon icon={faUserGroup} />
          </Button>

          <Form.Control
            style={{
              display: 'inline',
              transition: 'width 1s, padding 1s',
              width: allianceDisplayed ? '150px' : '0px',
              padding: allianceDisplayed ? '6px 12px' : '0px 2px',
              background: 'none',
              borderColor: '#0dcaf0',
              color: '#0dcaf0',
            }}
            type="text"
            variant="outline-info"
            placeholder="Alliance"
            value={allianceValue}
            onChange={(e) => setAlliance(e.target.value)}
          />

        </InputGroup>
      </OverlayTrigger>

    </div>
  );
}

export default Toolbar;
