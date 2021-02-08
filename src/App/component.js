import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button, AutoComplete, Typography, Table } from 'antd';
import { omitBy, size } from 'lodash';

import styles from './style.module.css';

const QUESTION_REFERENCES = {
  '543f7794-623d-4f0a-a668-53e5f531aafd': 'Politics',
  '8ddbf9a0-be52-40ed-bf5b-4c9609f9a128': 'Guns',
  '5ec5af28-5c30-4225-8393-c26326d8e2d9': 'Abortion',
  '681b6b25-c283-45cc-a72f-da375b44a265': 'Religion',
  '9de70c38-6de7-49e4-8c44-855c2d427968': 'Racial justice',
  '841d5268-ce50-45fd-9a86-d30197a6ee02': 'Climate change',
}

const COLUMNS = [
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
  },
  ...Object.entries(QUESTION_REFERENCES).map(([ref, text]) => ({
    title: text,
    dataIndex: ref,
    key: ref
  }))
];

export const Component = () => {
    const {
      getAccessTokenSilently,
      loginWithRedirect,
      isLoading,
      isAuthenticated
    } = useAuth0();
    const [itemsMap, setItemsMap] = useState([]);
    const [activeEmail, setActiveEmail] = useState(null);

    const [inputOptions, setInputOptions] = useState([]);

    const [matchingItems, setMatchingItems] = useState({});

    useEffect(() => {
      if (!isAuthenticated) return;

      const asyncGetSubmissions = async () => {
        const accessToken = await getAccessTokenSilently();

        const response = await fetch(
          'https://5qfry2gbjh.execute-api.eu-west-1.amazonaws.com/dev/getSubmissions',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        ).then(response => response.json());

        const itemsByEmail = response.reduce((accumulator, item) => {

          if (!item || !item.answers || !item.answers.find) return accumulator;

          const emailAnswer = item.answers.find(({ type }) => type === 'email');

          if (!emailAnswer) return accumulator;

          const key = emailAnswer.email;

          if (!key) return accumulator;

          return {
            ...accumulator,
            [key]: item.answers.reduce((accumulator, {
              choice: { label, other } = {},
              field: { ref } }) => {

                if (!Object.keys(QUESTION_REFERENCES).includes(ref)) {
                  return accumulator;
                }

               return {
                 ...accumulator,
                 [ref]: label || other
               }
            }, {})
          };

        }, {})

        setItemsMap(itemsByEmail);
      };

      asyncGetSubmissions();

    }, [isAuthenticated]);

    useEffect(() => {

      if (!activeEmail) {
        setMatchingItems({});
        return;
      };

      const activeItem = itemsMap[activeEmail];

      const nextMatchingItems = Object
        .entries(itemsMap)
        .map(([email, answersMap]) => {

          if (email === activeEmail) return false;

          const answersDiff = omitBy(answersMap, (value, key) => activeItem[key] === value);

          if (!size(answersDiff)) return false;

          return [email, answersDiff];
        })
        .filter(Boolean)
        .reduce((accumulator, [email, answersDiff]) => ({ ...accumulator, [email]: answersDiff }), {})

      setMatchingItems(nextMatchingItems);

    }, [activeEmail]);

    const handleSearch = searchText => {

      const nextInputOptions = Object
        .keys(itemsMap)
        .filter(key => key.includes(searchText))
        .map(key => ({ value: key }));

      setInputOptions(nextInputOptions);
    }

    const handleSelect = value => setActiveEmail(value);

    if (isLoading) {
      return null;
    }

    if (!isAuthenticated) {
      return (
        <Button size="large" onClick={() => loginWithRedirect()}>Log In</Button>
      );
    }

    return (
      <div className={styles.container}>
        <AutoComplete
          className={styles.search}
          onSearch={handleSearch}
          onSelect={handleSelect}
          options={inputOptions}
          placeholder="charles.ompassion@crisis.org"
        />
        <Table
          dataSource={activeEmail ? [
            {
              key: activeEmail,
              email: activeEmail,
              ...itemsMap[activeEmail]
            },
            ...Object
              .entries(matchingItems)
              .sort((a, b) => size(b[1]) - size(a[1]))
              .map(([email, answers]) => ({
                key: email,
                email,
                ...answers
              }))
          ] : []}
          columns={COLUMNS}
          locale={{
            emptyText: 'Search an email to see some delicious results'
          }}
          pagination={false}
        />
      </div>
    );

}

Component.displayName = 'App';
