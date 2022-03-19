import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import React, {useState} from 'react';

function Toolbar(props) {
    const [radioValue, setRadioValue] = useState('fighter');
  
    const radios = [
      { name: 'Fighter', value: 'fighter' },
      { name: 'Missle', value: 'missle' },
      { name: 'Carrier', value: 'carrier' },
      { name: 'Commander', value: 'commander' },
    ];
  
    return (
      <>
        <ButtonGroup style={{
            position: 'absolute',
            top: '20px',
            left: '20px'
        }}>
          {radios.map((radio, idx) => (
            <ToggleButton
              key={idx}
              id={`radio-${idx}`}
              type="radio"
              variant={'outline-info'}
              name="radio"
              value={radio.value}
              checked={radioValue === radio.value}
              onChange={(e) => {
                  props.changeVehicle(e.currentTarget.value); 
                  setRadioValue(e.currentTarget.value)
              }}
            >
              {radio.name}
            </ToggleButton>
          ))}
        </ButtonGroup>
      </>
    );
}

export default Toolbar;