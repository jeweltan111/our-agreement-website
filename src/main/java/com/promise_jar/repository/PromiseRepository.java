package com.promise_jar.repository;

import com.promise_jar.model.Promise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PromiseRepository
    extends JpaRepository<Promise, Long> {

  List<Promise> findByCreatorId(Long creatorId);

}
