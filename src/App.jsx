import { useEffect, useRef, useReducer } from "react";
import { Button } from "./components/Button";
import { Input } from "./components/Input";
import styles from "./App.module.css";
import {
  TOGGLE_FIELD,
  UPDATE_TASK_LIST,
  ADD_VALUE,
  SEARCH_VALUE,
  SET_FIELD_TRUE,
  SET_FIELD_FALSE,
} from "./components/constants.js";

// const taskListURL = "https://jsonplaceholder.typicode.com/todos";

//json-server --watch db.json
// http://localhost:3000
const taskListURL = "http://localhost:3000/tasks";

const initialState = {
  taskList: [],
  isLoading: false,
  isAdding: false,
  isRemoving: false,
  addValue: "",
  isUpdating: false,
  searchValue: "",
  isSorted: false,
  isRefreshedTasks: false,
};

function reducer(state, action) {
  const { type, payload } = action;
  switch (type) {
    case UPDATE_TASK_LIST:
      return { ...state, taskList: payload };
    case SET_FIELD_TRUE:
      return { ...state, [payload.field]: true };
    case SET_FIELD_FALSE:
      return { ...state, [payload.field]: false };
    case TOGGLE_FIELD:
      return { ...state, [payload.field]: !state[payload.field] };
    case ADD_VALUE:
      return { ...state, addValue: payload };
    case SEARCH_VALUE:
      return { ...state, searchValue: payload };
    default: {
      throw new Error("Unknown action");
    }
  }
}

export default function App() {
  const [appState, dispatcher] = useReducer(reducer, initialState);
  // const [taskList, setTaskList] = useState([]);
  // const [isLoading, setIsLoading] = useState(false);
  // const [isAdding, setIsAdding] = useState(false);
  // const [isRemoving, setIsRemoving] = useState(false);
  // const [addValue, setAddValue] = useState("");
  // const [isUpdating, setIsUpdating] = useState(false);
  // const [searchValue, setSearchValue] = useState("");
  // const [isSorted, setIsSorted] = useState(false);
  // const [isRefreshedTasks, setIsRefreshedTasks] = useState();

  let taskListBase = useRef();

  // utils
  function refreshTasks() {
    dispatcher({ type: TOGGLE_FIELD, payload: { field: "isRefreshedTasks" } });
  }

  function getId(event) {
    const taskContainer = event.target.closest(`.${styles.taskContainer}`);
    const id = taskContainer.dataset.id;
    console.log("id", id);
    return id;
  }

  function getNewInput(event) {
    const taskContainer = event.target.closest(`.${styles.taskContainer}`);
    const initialValue = taskContainer.querySelector("span").textContent;
    const userValue = prompt("Add updated input: ", initialValue);
    return userValue;
  }

  // working with tasks

  // on INPUT change
  const onInputChange = (event) => {
    const newValue = event.target.value;
    dispatcher({ type: ADD_VALUE, payload: newValue });
  };

  // add task
  const addTask = () => {
    if (appState.addValue.length == 0) {
      alert("Add valid task");
      return false;
    }
    dispatcher({ type: SET_FIELD_TRUE, payload: { field: "isAdding" } });
    // setIsAdding(true);
    fetch(taskListURL, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({
        title: appState.addValue,
        completed: false,
      }),
    })
      .then((rawResponse) => rawResponse.json())
      .then((resData) =>
        console.log(
          `Added ${appState.addValue} on server with response: ${resData}`
        )
      )
      .catch((error) => console.log(error))
      .finally(() => {
        dispatcher({ type: SET_FIELD_FALSE, payload: { field: "isAdding" } });
        // setIsAdding(false);
        refreshTasks();
        dispatcher({ type: ADD_VALUE, payload: "" });
        // setAddValue("");
      });
  };

  // update task
  const updateTask = (event) => {
    dispatcher({ type: SET_FIELD_TRUE, payload: { field: "isUpdating" } });
    // setIsUpdating(true);

    const userValue = getNewInput(event);
    const id = getId(event);
    const taskListURLToUpdate = taskListURL + "/" + id;
    console.log("taskListURLToUpdate", taskListURLToUpdate);

    if (userValue === null) {
      alert("Add valid task");
      return false;
    }

    fetch(taskListURLToUpdate, {
      method: "PUT",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({
        title: userValue,
        completed: false,
      }),
    })
      .then((rawResponse) => rawResponse.json())
      .then((resData) =>
        console.log(`Updated ${userValue} on server with response: ${resData}`)
      )
      .catch((error) => console.log(error))
      .finally(() => {
        dispatcher({ type: SET_FIELD_FALSE, payload: { field: "isUpdating" } });
        // setIsUpdating(false);
        refreshTasks();
      });
  };

  // SORTINTG
  function sortingTasks(taskArray) {
    const sorted = [...taskArray].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    console.log(sorted);
    return sorted;
  }

  const sortTasks = () => {
    if (appState.isSorted) {
      dispatcher({ type: UPDATE_TASK_LIST, payload: taskListBase.current });
      // setTaskList(taskListBase.current);
      dispatcher({ type: SET_FIELD_FALSE, payload: { field: "isSorted" } });
      // setIsSorted(false);s
    } else {
      const sorted = sortingTasks(appState.taskList);
      dispatcher({ type: UPDATE_TASK_LIST, payload: sorted });
      // setTaskList(sorted);
      dispatcher({ type: SET_FIELD_TRUE, payload: { field: "isSorted" } });
      // setIsSorted(true);
    }
  };

  // searching
  const searchTask = (value) => {
    value = value.trim().toLowerCase();
    console.log("value", value);

    const filteredTaskList = appState.taskList.filter((task) => {
      let title = task.title.trim().toLowerCase();
      return title.includes(value);
    });
    return filteredTaskList;
  };

  const onInputSearchChange = (event) => {
    if (event.target.value.length == 0) {
      refreshTasks();
    }
    const newValue = event.target.value;
    dispatcher({ type: SEARCH_VALUE, payload: newValue });
    // setSearchValue(newValue);
    // console.log("newValue", newValue);
    const filteredTaskList = searchTask(newValue);
    dispatcher({ type: UPDATE_TASK_LIST, payload: filteredTaskList });
    // setTaskList(filteredTaskList);
  };

  // REMOVE
  const removeTask = (event) => {
    dispatcher({ type: SET_FIELD_TRUE, payload: { field: "isRemoving" } });
    // setIsRemoving(true);
    const id = getId(event);
    const taskListURLToDelete = taskListURL + "/" + id;

    fetch(taskListURLToDelete, {
      method: "DELETE",
    })
      .then((rawResponse) => rawResponse.json())
      .then((resData) =>
        console.log(`Removed ${id} on server with response: ${resData}`)
      )
      .catch((error) => console.log(error))
      .finally(() => {
        dispatcher({ type: SET_FIELD_FALSE, payload: { field: "isRemoving" } });
        // setIsRemoving(false);
        refreshTasks();
      });
  };
  //
  // fetch data
  useEffect(() => {
    dispatcher({ type: SET_FIELD_TRUE, payload: { field: "isLoading" } });
    // setIsLoading(true);

    fetch(taskListURL)
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        dispatcher({ type: UPDATE_TASK_LIST, payload: resData });
        // setTaskList(resData);
        taskListBase.current = resData;
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        dispatcher({ type: SET_FIELD_FALSE, payload: { field: "isLoading" } });
        // setIsLoading(false);
      });
  }, [appState.isRefreshedTasks]);

  // return
  return (
    <>
      <div className={styles.container}>
        <h1>Tasks</h1>

        {appState.isLoading && <div className={styles.loader}></div>}

        {!appState.isLoading && (
          <>
            <div className={styles.inputField}>
              <Input
                name="add"
                placeholder="Add task"
                onChange={onInputChange}
                value={appState.addValue}
              />
              <Button onClick={addTask} disabled={appState.isAdding}>
                Add
              </Button>
            </div>
            <div className={styles.inputField}>
              <Input
                name="search"
                placeholder="Search task"
                onChange={onInputSearchChange}
                value={appState.searchValue}
              />
            </div>
            <div className={styles.sortingBtnContainer}>
              {!appState.isSorted && (
                <Button className={styles.sortingBtn} onClick={sortTasks}>
                  Sort ABC
                </Button>
              )}
              {appState.isSorted && (
                <Button className={styles.sortingBtn} onClick={sortTasks}>
                  Sort Base
                </Button>
              )}
            </div>
            <ul className={styles.taskList}>
              {appState.taskList.map(({ id, title, completed }) => {
                return (
                  <div className={styles.taskContainer} key={id} data-id={id}>
                    <li
                      className={`${styles.taskItem} ${completed ? styles.completedTaskItem : styles.unCompletedTaskItem}`}
                    >
                      <span>{title}</span>
                    </li>
                    <div className={styles.buttonsContainer}>
                      <Button id={id} onClick={updateTask}>
                        Update
                      </Button>
                      <Button id={id} onClick={removeTask}>
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
